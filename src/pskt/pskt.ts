import { SUBNETWORK_ID_NATIVE } from '../consensus';
import {
  SigHashType,
  SignableTransaction,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionOutput, UtxoEntry
} from '../tx';
import { combineGlobals, Global, KeySource } from './';
import { inputFromTransactionInput, outputFromTransactionOutput, transactionToPSKT } from './convert';
import { combineInputs, Input } from './input';
import { combineOutputs, Output } from './output';
import { maxValueOfU } from '../validator.ts';

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

export interface PSKTState {
  global: Global;
  inputs: Input[];
  outputs: Output[];
}

/**
 * PSKT implementation with role-based type safety
 */
export class PSKT {
  public state?: PSKTState;
  public role: Role;

  constructor(payload: PSKT | Transaction | string | undefined) {
    let pskt: PSKT;
    if (payload instanceof PSKT) {
      pskt = payload;
    } else if (payload instanceof Transaction) {
      pskt = transactionToPSKT(payload);
    } else if (typeof payload === 'string') {
      pskt = PSKT.fromHex(payload);
    } else {
      throw new Error('Invalid payload');
    }
    this.state = pskt.state;
    this.role = 'Init';
  }

  get payload(): string {
    return this.toHex();
  }

  toCreator = (): PSKT => {
    if (this.role === 'Init' && this.state) {
      if (this.state) throw new Error('Create state is not allowed for PSKT initialized from transaction or a payload');
      this.state = { global: new Global(), inputs: [], outputs: [] };
      this.role = 'Creator';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  };

  toConstructor(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Creator') {
      this.role = 'Constructor';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  }

  toUpdater(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor') {
      this.role = 'Updater';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  }

  toSigner(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor' || this.role === 'Updater' || this.role === 'Combiner') {
      this.role = 'Signer';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  }

  toCombiner(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Constructor' || this.role === 'Updater' || this.role === 'Signer') {
      this.role = 'Combiner';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  }

  toFinalizer(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Combiner') {
      this.role = 'Finalizer';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
  }

  toExtractor(): PSKT {
    this.ensureInitialized();

    if (this.role === 'Init' || this.role === 'Finalizer') {
      this.role = 'Extractor';
      return this;
    }

    throw new Error(`Unexpected state: ${JSON.stringify(this.state, replacer)}`);
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

  input(input: TransactionInput): PSKT {
    this.ensureRole('Constructor');

    this.state!.inputs.push(inputFromTransactionInput(input));
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
        throw new Error("Tx not finalized");
      }
      dest.signatureScript = src.finalScriptSig;
    });

    return (mass: bigint) => {
      mutableTx.setMass(mass);
      return [mutableTx, entries];
    };
  }

  public extractTx(): (mass: number) => [Transaction, Array<UtxoEntry | undefined>] {
    const [tx, entries] = this.extractTxUnchecked()(0n);



    tx.populatedInputs().forEach(([input, entry], idx) => {
      const engine = TxScriptEngine.fromTransactionInput(verifiableTx, input, idx, entry, reusedValues, cache, false);
      engine.execute();
    });

    const finalEntries = mutableTx.entries;
    const finalTx = mutableTx.tx;

    return (mass: number) => {
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
    const jsonStr = JSON.stringify(this.state, replacer);
    const hex = Buffer.from(jsonStr).toString('hex');
    return `PSKT${hex}`;
  }

  public static fromHex(hex: string, role?: Role): PSKT {
    if (!hex.startsWith('PSKT')) {
      throw new Error('PsktPrefixError');
    }

    const hexData = hex.slice(4); // Remove PSKT prefix
    const jsonStr = Buffer.from(hexData, 'hex').toString();
    const { global, inputs, outputs } = JSON.parse(jsonStr, reviver);
    return { state: { global, inputs, outputs }, role } as PSKT;
  }

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

const replacer = (_key: string, value: any) => {
  return typeof value === 'bigint' ? value.toString() + 'n' : value;
};

const reviver = (_key: string, value: any) => {
  return typeof value === 'string' && /^\d+n$/.test(value) ? BigInt(value.slice(0, -1)) : value;
};

export interface SignInputOk {
  signature: Signature;
  pubKey: string;
  keySource?: KeySource;
}
