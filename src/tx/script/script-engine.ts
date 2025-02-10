import {
  IVerifiableTransaction,
  MAX_SCRIPT_ELEMENT_SIZE,
  MAX_SCRIPT_PUBLIC_KEY_VERSION,
  MAX_SCRIPTS_SIZE,
  OpCodes,
  SigHashType,
  SignableTransaction,
  toSmallInt,
  TransactionInput,
  TxScriptError,
  UtxoEntry
} from '../';
import { OpCode, OpCond } from './op-codes';
import { ScriptClassHelper } from './script-class';
import { DataStack, OpcodeDataBool } from './dataStack';
import { MAX_OPS_PER_SCRIPT, MAX_PUB_KEYS_PER_MUTLTISIG } from '../constants';
import { SizedEncodeInt } from './dataStack/sized-encode-int.ts';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { TransactionSigningHashing } from '../hashing/tx-sig.ts';
import { ScriptPublicKey } from '../../consensus';

type Signature = { type: 'Secp256k1'; signature: Uint8Array } | { type: 'Ecdsa'; signature: Uint8Array };

type PublicKey = { type: 'Schnorr'; key: Uint8Array } | { type: 'Ecdsa'; key: Uint8Array };

class SigCacheKey {
  constructor(
    public signature: Signature,
    public pubKey: PublicKey,
    public message: Uint8Array
  ) {}
}

type ScriptSource<T extends IVerifiableTransaction> =
  | { type: 'TxInput'; tx: T; input: TransactionInput; idx: number; utxoEntry: UtxoEntry; isP2sh: boolean }
  | { type: 'StandAloneScripts'; scripts: Uint8Array[] };

function* parseScript(script: Uint8Array): IterableIterator<OpCode | Error> {
  const it = script[Symbol.iterator]();
  while (true) {
    const opcode = OpCode.deserialize(it);

    if (opcode === undefined) break;
    yield opcode;
  }
}

function getSigOpCount(signatureScript: Uint8Array, prevScriptPublicKey: ScriptPublicKey): number {
  const isP2sh = ScriptClassHelper.isPayToScriptHash(prevScriptPublicKey.script);
  const scriptPubKeyOps = Array.from(parseScript(prevScriptPublicKey.script));
  if (!isP2sh) {
    return getSigOpCountByOpcodes(scriptPubKeyOps);
  }

  const signatureScriptOps = Array.from(parseScript(signatureScript));
  if (signatureScriptOps.length === 0 || signatureScriptOps.some((op) => op instanceof OpCode && !op.isPushOpcode())) {
    return 0;
  }

  const lastOp = signatureScriptOps[signatureScriptOps.length - 1];
  if (!(lastOp instanceof OpCode)) {
    return 0;
  }
  const p2shScript = lastOp.getData();
  const p2shOps = Array.from(parseScript(p2shScript));
  return getSigOpCountByOpcodes(p2shOps);
}

function getSigOpCountByOpcodes(opcodes: Array<OpCode | Error>): number {
  // TODO: Check for overflows
  let numSigs = 0;
  for (let i = 0; i < opcodes.length; i++) {
    const opcode = opcodes[i];

    if (!(opcode instanceof OpCode)) break;

    switch (opcode.value()) {
      case OpCodes.OpCheckSig:
      case OpCodes.OpCheckSigVerify:
      case OpCodes.OpCheckSigECDSA:
        numSigs += 1;
        break;
      case OpCodes.OpCheckMultiSig:
      case OpCodes.OpCheckMultiSigVerify:
      case OpCodes.OpCheckMultiSigECDSA:
        if (i === 0) {
          numSigs += MAX_PUB_KEYS_PER_MUTLTISIG;
          continue;
        }

        const prevOpcode = opcodes[i - 1];
        if (!(prevOpcode instanceof OpCode)) break;
        if (prevOpcode.value() >= OpCodes.OpTrue && prevOpcode.value() <= OpCodes.Op16) {
          numSigs += toSmallInt(prevOpcode);
        } else {
          numSigs += MAX_PUB_KEYS_PER_MUTLTISIG;
        }
        break;
      default:
        break; // If the opcode is not a sigop, no need to increase the count
    }
  }
  return numSigs;
}

function isUnspendable(script: Uint8Array): boolean {
  return Array.from(parseScript(script)).some(
    (op, index) => index === 0 && op instanceof OpCode && op.value() === OpCodes.OpReturn
  );
}

class TxScriptEngine<T extends IVerifiableTransaction> {
  dstack = new DataStack();
  astack = new DataStack();
  scriptSource: ScriptSource<T>;
  sigCache: Map<SigCacheKey, boolean>;
  condStack: OpCond[] = [];
  numOps: number = 0;
  kip10Enabled: boolean;

  constructor(sigCache: Map<SigCacheKey, boolean>, kip10Enabled: boolean) {
    this.scriptSource = { type: 'StandAloneScripts', scripts: [] };
    this.sigCache = sigCache;
    this.kip10Enabled = kip10Enabled;
  }

  static fromTransactionInput<T extends IVerifiableTransaction>(
    tx: T,
    input: TransactionInput,
    inputIdx: number,
    utxoEntry: UtxoEntry,
    sigCache: Map<SigCacheKey, boolean>,
    kip10Enabled: boolean
  ): TxScriptEngine<T> {
    const scriptPublicKey = utxoEntry.scriptPublicKey.script;
    const isP2sh = ScriptClassHelper.isPayToScriptHash(scriptPublicKey);
    if (inputIdx >= tx.tx().inputs.length) {
      throw new Error('Malformed input');
    }
    const engine = new TxScriptEngine<T>(sigCache, kip10Enabled);
    engine.scriptSource = { type: 'TxInput', tx, input, idx: inputIdx, utxoEntry, isP2sh };
    return engine;
  }

  static fromScript<T extends IVerifiableTransaction>(
    script: Uint8Array,
    sigCache: Map<SigCacheKey, boolean>,
    kip10Enabled: boolean
  ): TxScriptEngine<T> {
    const engine = new TxScriptEngine<T>(sigCache, kip10Enabled);
    engine.scriptSource = { type: 'StandAloneScripts', scripts: [script] };
    return engine;
  }

  isExecuting(): boolean {
    return this.condStack.length === 0 || this.condStack[this.condStack.length - 1] === OpCond.True;
  }

  private executeOpcode(opcode: OpCode): void {
    if (!opcode.isPushOpcode()) {
      this.numOps += 1;
      if (this.numOps > 201) {
        TxScriptError.throwTooManyOperations(this.numOps);
      }
    } else if (opcode.len() > 520) {
      throw new Error(
        `TxScriptError: element size ${opcode.len()} exceeds max allowed size ${MAX_SCRIPT_ELEMENT_SIZE}`
      );
    }

    if (this.isExecuting() || opcode.isConditional()) {
      if (opcode.value() > 0 && opcode.value() <= 0x4e) {
        opcode.checkMinimalDataPush();
      }
      opcode.execute(this);
    }
  }

  private executeScript(script: Uint8Array, verifyOnlyPush: boolean): void {
    const parsedScript = parseScript(script);
    while (true) {
      const scriptResult = parsedScript.next();
      if (scriptResult.done) {
        break;
      }
      const opcode = scriptResult.value;

      if (opcode instanceof TxScriptError || opcode instanceof Error) {
        throw opcode;
      }

      if (opcode.isDisabled()) {
        TxScriptError.throwOpcodeDisabledError(opcode);
      }

      if (opcode.alwaysIllegal()) {
        TxScriptError.throwOpcodeReservedError(opcode);
      }

      if (verifyOnlyPush && !opcode.isPushOpcode()) {
        TxScriptError.throwSignatureScriptNotPushOnly();
      }

      this.executeOpcode(opcode);

      const combinedSize = this.astack.length + this.dstack.length;
      if (combinedSize > 244) {
        TxScriptError.throwStackSizeExceeded(combinedSize, 244);
      }
    }

    if (this.condStack.length > 0) {
      TxScriptError.throwErrUnbalancedConditional();
    }

    this.astack = new DataStack();
    this.numOps = 0;
  }

  execute(): void {
    let scripts = [];
    let isP2shVal = false;

    switch (this.scriptSource.type) {
      case 'TxInput':
        const { input, utxoEntry, isP2sh } = this.scriptSource;
        if (utxoEntry.scriptPublicKey.version > MAX_SCRIPT_PUBLIC_KEY_VERSION) {
          return;
        }
        scripts = [input.signatureScript, utxoEntry.scriptPublicKey.script];
        isP2shVal = isP2sh;
        break;

      case 'StandAloneScripts':
        scripts = this.scriptSource.scripts;
        isP2shVal = false;
        break;
      default:
        throw new Error('Invalid script source');
    }

    // TODO: run all in same iterator?
    // When both the signature script and public key script are empty the
    // result is necessarily an error since the stack would end up being
    // empty which is equivalent to a false top element. Thus, just return
    // the relevant error now as an optimization.
    if (scripts.length === 0) {
      throw new Error('TxScriptError: no scripts to run');
    }

    if (scripts.every((e) => e.length === 0)) {
      TxScriptError.throwEvalFalseError();
    }

    const overLimitOp = scripts.find((s) => s.length > MAX_SCRIPTS_SIZE);
    if (overLimitOp) {
      TxScriptError.throwScriptSize(overLimitOp.length, MAX_SCRIPTS_SIZE);
    }

    let savedStack: Uint8Array[] | undefined;
    // try_for_each quits only if an error occurred. So, we always run over all scripts if
    // each is successful
    for (let idx = 0; idx < scripts.length; idx++) {
      const s = scripts[idx];
      if (s.length === 0) continue;

      const verifyOnlyPush = idx === 0 && this.scriptSource.type === 'TxInput';
      if (isP2shVal && idx === 1) {
        // Save script in p2sh
        savedStack = [...this.dstack];
      }
      this.executeScript(s, verifyOnlyPush);
    }

    if (isP2shVal) {
      this.checkErrorCondition(false);
      if (!savedStack) {
        TxScriptError.throwEmptyStackError();
        return;
      }
      this.dstack = new DataStack(...savedStack);
      const script = this.dstack.pop();
      if (!script) {
        TxScriptError.throwEmptyStackError();
        return;
      }
      this.executeScript(script, false);
    }

    this.checkErrorCondition(true);
  }

  /**
   * checkErrorCondition is called whenever we finish a chunk of the scripts
   * (all original scripts, all scripts including P2SH, and maybe future extensions).
   *
   * @param finalScript - Indicates if this is the final script being executed.
   * @throws {TxScriptError} - Throws 'Clean stack' if more than one item is left on the stack.
   * @throws {TxScriptError} - Throws 'Empty stack' if no items are left on the stack.
   * @throws {TxScriptError} - Throws 'Eval false' if the top item on the stack is false.
   */
  private checkErrorCondition(finalScript: boolean): void {
    if (finalScript) {
      if (this.dstack.length > 1) {
        TxScriptError.throwCleanStackError(this.dstack.length - 1);
      } else if (this.dstack.length === 0) {
        TxScriptError.throwEmptyStackError();
      }
    }

    const [v] = this.dstack.popRaw(1);
    const result = OpcodeDataBool.deserialize(v);

    if (!result) {
      TxScriptError.throwEvalFalseError();
    }
  }

  static checkPubKeyEncoding(pubKey: Uint8Array): void {
    if (pubKey.length !== 32) {
      TxScriptError.throwPubKeyFormat();
    }
  }

  static checkPubKeyEncodingEcdsa(pubKey: Uint8Array): void {
    if (pubKey.length !== 33) {
      TxScriptError.throwPubKeyFormat();
    }
  }

  opCheckMultisigSchnorrOrEcdsa(ecdsa: boolean) {
    const [numKeys] = this.dstack.popItems(1);
    if (numKeys.value < 0n) {
      TxScriptError.throwInvalidPubKeyCount(`number of pubkeys ${numKeys.value} is negative`);
    } else if (numKeys.value > MAX_PUB_KEYS_PER_MUTLTISIG) {
      TxScriptError.throwInvalidPubKeyCount(`too many pubkeys ${numKeys.value} > ${MAX_PUB_KEYS_PER_MUTLTISIG}`);
    }
    const numKeysValue = Number(numKeys.value);

    this.numOps += numKeysValue;
    if (this.numOps > MAX_OPS_PER_SCRIPT) {
      TxScriptError.throwTooManyOperations(MAX_OPS_PER_SCRIPT);
    }

    if (this.dstack.length < numKeysValue) TxScriptError.throwInvalidStackOperation(numKeysValue, this.dstack.length);

    const pubKeys = this.dstack.splice(this.dstack.length - numKeysValue, numKeysValue);

    const [numSigs] = this.dstack.popItems(1);
    const numSigsValue = Number(numSigs.value);
    if (numSigs.value < 0) {
      TxScriptError.throwInvalidSignatureCount(`number of signatures ${numSigs.value} is negative`);
    } else if (numSigsValue > numKeysValue) {
      TxScriptError.throwInvalidSignatureCount(`more signatures than pubkeys ${numSigs} > ${numKeys}`);
    }

    if (this.dstack.length < numSigsValue) TxScriptError.throwInvalidStackOperation(numSigsValue, this.dstack.length);

    const signatures = this.dstack.splice(this.dstack.length - numSigsValue, numSigsValue);

    let failed = false;
    const pubKeyIter = pubKeys[Symbol.iterator]();
    outer: for (const [sigIdx, signature] of signatures.entries()) {
      if (signature.length === 0) {
        failed = true;
        break;
      }

      const typ = signature[signature.length - 1];
      const sig = signature.slice(0, -1);
      const hashType = SigHashType.fromU8(typ);
      if (!hashType) {
        throw new Error(`TxScriptError: InvalidSigHashType: ${typ}`);
      }

      while (true) {
        if (pubKeys.length < numSigsValue - sigIdx) {
          failed = true;
          break outer;
        }
        const pubKey = pubKeyIter.next().value!;

        const checkSignatureResult = ecdsa
          ? this.checkEcdsaSignature(hashType, pubKey, sig)
          : this.checkSchnorrSignature(hashType, pubKey, sig);

        if (checkSignatureResult) {
          break;
        }
      }
    }

    if (failed && signatures.some((sig) => sig.length > 0)) {
      throw new Error('TxScriptError: not all signatures empty on failed checkmultisig');
    }

    this.dstack.pushItem(SizedEncodeInt.from(!failed ? 1n : 0n));
  }

  checkSchnorrSignature(hashType: SigHashType, pk: Uint8Array, schnorrSig: Uint8Array): boolean {
    if (this.scriptSource.type !== 'TxInput') {
      throw new Error('TxScriptError: engine is not running on a transaction input');
    }

    if (schnorrSig.length !== 64) {
      throw new Error(`TxScriptError: invalid signature length ${schnorrSig.length}`);
    }

    TxScriptEngine.checkPubKeyEncoding(pk);

    const signableTx = new SignableTransaction(this.scriptSource.tx.tx(), []);
    const sigHash = TransactionSigningHashing.calcSchnorrSignatureHash(signableTx, this.scriptSource.idx, hashType);
    const msg = sigHash.toBytes();
    const sigCacheKey = new SigCacheKey(
      { type: 'Secp256k1', signature: schnorrSig },
      { type: 'Schnorr', key: pk },
      msg
    );

    const cachedResult = this.sigCache.get(sigCacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const valid = schnorr.verify(schnorrSig, msg, Buffer.from(pk).toString('hex'));
    this.sigCache.set(sigCacheKey, valid);
    return valid;
  }

  checkEcdsaSignature(hashType: SigHashType, key: Uint8Array, ecdsaSig: Uint8Array): boolean {
    if (this.scriptSource.type !== 'TxInput') {
      throw new Error('TxScriptError: Engine is not running on a transaction input');
    }

    if (ecdsaSig.length !== 64) {
      TxScriptError.throwSigLength(ecdsaSig.length);
    }

    TxScriptEngine.checkPubKeyEncodingEcdsa(key);

    const signableTx = new SignableTransaction(this.scriptSource.tx.tx(), []);
    const sigHash = TransactionSigningHashing.calcEcdsaSignatureHash(signableTx, this.scriptSource.idx, hashType);
    const msg = sigHash.toBytes();
    const sigCacheKey = new SigCacheKey({ type: 'Ecdsa', signature: ecdsaSig }, { type: 'Ecdsa', key }, msg);

    const cachedResult = this.sigCache.get(sigCacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const valid = secp256k1.verify(ecdsaSig, msg, Buffer.from(key).toString('hex'));
    this.sigCache.set(sigCacheKey, valid);
    return valid;
  }
}

export { SigCacheKey, TxScriptEngine, parseScript, getSigOpCount, isUnspendable };
