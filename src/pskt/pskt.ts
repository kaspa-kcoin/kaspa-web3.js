import { SUBNETWORK_ID_NATIVE } from '../consensus';
import {
  Hash,
  PopulatedTransaction,
  SigCacheKey,
  SigHashType,
  SignableTransaction,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TxScriptEngine,
  UtxoEntry
} from '../tx';
import { combineGlobals, Global, KeySource } from './';
import { inputFromTransactionInput, outputFromTransactionOutput, transactionToPSKT } from './convert';
import { combineInputs, Input } from './input';
import { combineOutputs, Output } from './output';
import { maxValueOfU } from '../utils.ts';
import { isEqual, isHexString, isInputEqual, isOutputEqual } from './utils.ts';
import { Buffer } from 'buffer';

export type Role = 'Init' | 'Creator' | 'Constructor' | 'Updater' | 'Signer' | 'Combiner' | 'Finalizer' | 'Extractor';
/**
 * Enum representing different signature types in PSKT
 */
export enum SignatureType {
  ECDSA,
  Schnorr
}

/**
 * Signature representation for PSKT
 */
export class Signature {
  constructor(
    private type: SignatureType,
    private signature: Uint8Array
  ) {}

  /**
   * Converts signature to bytes
   */
  public intoBytes(): Uint8Array {
    // Ensure 64 bytes length
    if (this.signature.length !== 64) {
      throw new Error('Invalid signature length');
    }
    return this.signature;
  }
}
export type PartialSigs = Map<string, Signature>;

export class PSKTState {
  global: Global;
  inputs: Input[];
  outputs: Output[];

  constructor() {
    this.global = new Global();
    this.inputs = [];
    this.outputs = [];
  }

  equals(rhs: PSKTState) {
    if (!this.global.equals(rhs.global)) {
      return false;
    }

    for (let index = 0; index < this.inputs.length; index++) {
      const input = this.inputs[index];
      const isInput = input instanceof Input;
      if (!input.equals(rhs.inputs[index])) {
        return false;
      }
    }

    for (let index = 0; index < this.outputs.length; index++) {
      if (!isOutputEqual(this.outputs[index], rhs.outputs[index])) {
        return false;
      }
    }

    return true;
  }
}

/**
 * PSKT implementation with role-based type safety
 */
export class PSKT {
  public state?: PSKTState;
  public role: Role;

  constructor(payload?: PSKT | Transaction | string) {
    if (!payload) {
      this.role = 'Init';
      return;
    }

    let pskt: PSKT;
    if (payload instanceof PSKT) {
      pskt = payload;
    } else if (payload instanceof Transaction) {
      pskt = transactionToPSKT(payload);
    } else if (typeof payload === 'string') {
      pskt = PSKT.fromHex(payload);
    }

    this.state = pskt!.state;
    this.role = 'Init';
  }

  get payload(): string {
    return this.toHex();
  }

  toCreator = (): PSKT => {
    if (this.role === 'Init') {
      if (this.state) throw new Error('Create state is not allowed for PSKT initialized from transaction or a payload');
      this.state = new PSKTState();
      this.role = 'Creator';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  };

  toConstructor(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Creator') {
      this.role = 'Constructor';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  toUpdater(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor') {
      this.role = 'Updater';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  toSigner(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor' || this.role === 'Updater' || this.role === 'Combiner') {
      this.role = 'Signer';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  toCombiner(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor' || this.role === 'Updater' || this.role === 'Signer') {
      this.role = 'Combiner';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  toFinalizer(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Combiner') {
      this.role = 'Finalizer';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  toExtractor(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Finalizer') {
      this.role = 'Extractor';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, PSKT.replacer)}`);
  }

  fallbackLockTime(lockTime: bigint): PSKT {
    this.ensureRole('Creator');

    this.state!.global.fallbackLockTime = lockTime;
    return this;
  }

  inputsModifiable(): PSKT {
    this.ensureRole('Creator');

    this.state!.global.inputsModifiable = true;
    return this;
  }

  outputsModifiable(): PSKT {
    this.ensureRole('Creator');

    this.state!.global.outputsModifiable = true;
    return this;
  }

  noMoreInputs(): PSKT {
    this.ensureRole('Constructor');

    this.state!.global.inputsModifiable = false;
    return this;
  }

  noMoreOutputs(): PSKT {
    this.ensureRole('Constructor');

    this.state!.global.outputsModifiable = false;
    return this;
  }

  addTxInput(input: TransactionInput): PSKT {
    this.ensureRole('Constructor');

    return this.addInput(inputFromTransactionInput(input));
  }

  addInput(input: Input): PSKT {
    this.ensureRole('Constructor');

    this.state!.inputs.push(input);
    this.state!.global.inputCount += 1;
    return this;
  }

  output(output: TransactionOutput): PSKT {
    this.ensureRole('Constructor');

    this.state!.outputs.push(outputFromTransactionOutput(output));
    this.state!.global.outputCount += 1;
    return this;
  }

  setSequence(sequence: bigint, inputIndex: number): PSKT {
    this.ensureRole('Updater');

    this.state!.inputs[inputIndex].sequence = sequence;
    return this;
  }

  public async passSignature(
    signFn: (tx: SignableTransaction, sigHashes: SigHashType[]) => Promise<SignInputOk[]>
  ): Promise<PSKT> {
    this.ensureRole('Signer');

    const unsignedTx = this.unsignedTx();
    const sigHashes = this.state!.inputs.map((input) => input.sighashType);
    const signResults = await signFn(unsignedTx, sigHashes);

    this.state!.inputs.forEach((input, index) => {
      const { signature, pubKey, keySource } = signResults[index];
      input.bip32Derivations.set(pubKey, keySource);
      input.partialSigs.set(pubKey, signature);
    });

    return this;
  }

  combine(rhs: PSKT): PSKT {
    this.ensureRole('Combiner');

    combineGlobals(this.state!.global, rhs.state!.global);

    if (this.state!.inputs.length > rhs.state!.inputs.length) {
      for (let index = 0; index < this.state!.inputs.length; index++) {
        const input1 = this.state!.inputs[index];
        if (!rhs.state!.inputs[index]) break;
        combineInputs(input1, rhs.state!.inputs[index]);
      }
    } else {
      for (let index = 0; index < rhs.state!.inputs.length; index++) {
        const input1 = rhs.state!.inputs[index];
        if (!this.state!.inputs[index]) break;
        combineInputs(input1, this.state!.inputs[index]);
      }
    }

    if (this.state!.outputs.length > rhs.state!.outputs.length) {
      for (let index = 0; index < this.state!.outputs.length; index++) {
        const output1 = this.state!.outputs[index];
        if (!rhs.state!.outputs[index]) break;
        combineOutputs(output1, rhs.state!.outputs[index]);
      }
    } else {
      for (let index = 0; index < rhs.state!.outputs.length; index++) {
        const output1 = rhs.state!.outputs[index];
        if (!this.state!.outputs[index]) break;
        combineOutputs(output1, this.state!.outputs[index]);
      }
    }

    return this;
  }

  public async finalize(finalSigFn: (inner: PSKT) => Promise<Uint8Array[]>): Promise<PSKT> {
    const sigs = await finalSigFn(this);

    if (sigs.length !== this.state!.inputs.length) {
      throw new Error(`Wrong final signature count, expected ${this.state!.inputs.length}, actual ${sigs.length}`);
    }

    this.state!.inputs.forEach((input, idx) => {
      const sig = sigs[idx];
      if (sig.length === 0) {
        throw new Error('Empty signature');
      }
      input.sequence = input.sequence ?? maxValueOfU(64);
      input.finalScriptSig = sig;
    });

    this.state!.global.id = this.calculateId();
    return this;
  }

  public extractTxUnchecked(): (mass: bigint) => [Transaction, Array<UtxoEntry | undefined>] {
    const tx = this.unsignedTx();
    const entries = tx.entries;
    const mutableTx = tx.tx;

    mutableTx.inputs.forEach((dest, idx) => {
      const src = this.state!.inputs[idx];
      if (!src.finalScriptSig) {
        throw new Error('Tx not finalized');
      }
      dest.signatureScript = src.finalScriptSig;
    });

    return (mass: bigint) => {
      mutableTx.setMass(mass);
      return [mutableTx, entries];
    };
  }

  public extractTx(): (mass: bigint) => [Transaction, Array<UtxoEntry | undefined>] {
    const [tx, entries] = this.extractTxUnchecked()(0n);
    const verifiableTx = new PopulatedTransaction(
      tx,
      entries.filter((e) => e !== undefined)
    );

    verifiableTx.populatedInputs().forEach(([input, entry], idx) => {
      const engine = TxScriptEngine.fromTransactionInput(
        verifiableTx,
        input,
        idx,
        entry,
        new Map<SigCacheKey, boolean>(),
        false
      );
      engine.execute();
    });

    const finalEntries = verifiableTx.entries();
    const finalTx = verifiableTx.tx();

    return (mass: bigint) => {
      finalTx.setMass(mass);
      return [finalTx, finalEntries];
    };
  }

  calculateId(): TransactionId {
    return this.unsignedTx().tx.id;
  }

  private unsignedTx(): SignableTransaction {
    const state = this.state!;
    // Create new transaction with mapped inputs and outputs
    const tx = new Transaction(
      state.global.txVersion,
      state.inputs.map(
        (input) =>
          new TransactionInput(
            input.previousOutpoint,
            new Uint8Array(),
            BigInt(input.sequence || Number.MAX_SAFE_INTEGER),
            input.sigOpCount || 0
          )
      ),
      state.outputs.map((output) => new TransactionOutput(BigInt(output.amount), output.scriptPublicKey)),
      BigInt(this.determineLockTime()),
      SUBNETWORK_ID_NATIVE,
      0n,
      new Uint8Array()
    );

    // Collect UTXO entries
    const entries = state.inputs.map((input) => input.utxoEntry).filter((entry) => entry !== undefined);

    return new SignableTransaction(tx, entries);
  }

  private determineLockTime(): bigint {
    const state = this.state!;
    const maxInputTime = state.inputs.length > 0 ? Math.max(...state.inputs.map((input) => input.minTime ?? 0)) : 0;

    return BigInt(maxInputTime || state.global.fallbackLockTime || 0);
  }

  public toHex(): string {
    const jsonStr = this.toJSON();
    const hex = Buffer.from(jsonStr).toString('hex');
    return `PSKT${hex}`;
  }

  public equals(rhs: PSKT): boolean {
    if (!rhs.state.equals(this.state)) {
      return false;
    }
    return ths.role === rhs.role;
  }

  public static fromHex(hex: string, role?: Role): PSKT {
    if (!hex.startsWith('PSKT')) {
      throw new Error('PsktPrefixError');
    }

    const hexData = hex.slice(4); // Remove PSKT prefix
    const jsonStr = Buffer.from(hexData, 'hex').toString();
    const { global, inputs, outputs } = JSON.parse(jsonStr, PSKT.reviver);
    return { state: { global, inputs, outputs }, role } as PSKT;
  }

  public toJSON(): string {
    return JSON.stringify(this.state, PSKT.replacer);
  }

  public static fromJSON(json: string, role?: Role): PSKT {
    const { global, inputs, outputs } = JSON.parse(json, PSKT.reviver);
    const pskt = new PSKT();
    pskt.state = new PSKTState();
    pskt.state.global = Global.fromJson(JSON.stringify(global, PSKT.replacer));
    for (const item of inputs) {
      let input = Input.fromJson(JSON.stringify(item, PSKT.replacer));
      pskt.state.inputs.push(input);
    }
    pskt.state.outputs = outputs as Output[];
    if (role) pskt.role = role;

    return pskt;
  }

  static replacer = (_key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString() + 'n';
    if (value instanceof Hash) return value.toString();
    return value;
  };

  static reviver = (_key: string, value: any) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) return BigInt(value.slice(0, -1));
    if (typeof value === 'string' && isHexString(value)) {
      if (value.length === 64) {
        return Hash.fromHex(value);
      }
      return Uint8Array.from(Buffer.from(value, 'hex'));
    }
    return value;
  };

  private ensureInitialized(): void {
    if (!this.state && (this.role === 'Init' || this.role === 'Creator')) {
      throw new Error('PSKT must be initialized with a payload or CREATE role');
    }
  }

  private ensureRole(role: Role): void {
    if (this.role !== role) {
      throw new Error(`Unexpected role: ${this.role}`);
    }
  }
}

export interface SignInputOk {
  signature: Signature;
  pubKey: string;
  keySource?: KeySource;
}
