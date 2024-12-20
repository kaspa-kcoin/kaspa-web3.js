import { Address } from './address';
import { Fees, GeneratorSettings, PaymentOutput, TransactionId, TransactionOutpoint, UtxoEntryReference } from './tx';
import { addressFromScriptPublicKey } from './utils';
import { OpCodes, ScriptBuilder } from './tx-script';
import { NetworkId } from './consensus';

/**
 * Interface representing parameters for sending KRC-20 tokens.
 */
export interface ISendKrc20Params {
  /**
   * Sets the priority fee for the transaction.
   * @param priorityFee - The priority fee to set.
   */
  setPriorityFee(priorityFee: Fees): void;
}

/**
 * Class representing parameters for sending Kaspa.
 */
class SendKasParams implements ISendKrc20Params {
  sender: Address;
  amount: bigint;
  receiver: Address;
  networkId: NetworkId;
  priorityFee?: Fees;

  /**
   * Creates an instance of SendKasPramas.
   * @param sender - The sender's address.
   * @param amount - The amount to send.
   * @param receiver - The receiver's address.
   * @param networkId - The network ID.
   * @param priorityFee - The optional priority fee.
   */
  constructor(
    sender: Address | string,
    amount: bigint,
    receiver: Address | string,
    networkId: NetworkId,
    priorityFee?: Fees
  ) {
    this.sender = sender instanceof Address ? sender : Address.fromString(sender);
    this.amount = amount;
    this.receiver = receiver instanceof Address ? receiver : Address.fromString(receiver);
    this.networkId = networkId;
    this.priorityFee = priorityFee;
  }

  setPriorityFee(priorityFee: Fees): void {
    this.priorityFee = priorityFee;
  }

  /**
   * Converts the parameters to generator settings.
   * @param uxtos - The UTXO entries.
   * @returns The generator settings.
   */
  toGeneratorSettings(uxtos: UtxoEntryReference[] = []): GeneratorSettings {
    const output = new PaymentOutput(this.receiver, this.amount);
    return new GeneratorSettings(output, this.sender, uxtos, this.networkId, this.priorityFee);
  }
}

/**
 * Class representing parameters for sending KRC-20 tokens.
 */
class SendKrc20Params implements ISendKrc20Params {
  sender: Address;
  krc20Amount: bigint;
  receiver: Address;
  tick: string;
  networkId: NetworkId;
  /*
   * The output amount for the transaction.
   * Note: this amount used for the first output value for commit transaction.
   */
  outputAmount: bigint;
  priorityFee?: Fees;

  /**
   * Creates an instance of SendKrc20Pramas.
   * @param sender - The sender's address.
   * @param krc20Amount - The amount to send.
   * @param receiver - The receiver's address.
   * @param tick - The token ticker.
   * @param networkId - The network ID.
   * @param outputAmount - The output amount for the commit transaction.
   * @param priorityFee - The optional priority fee, default is 0.
   */
  constructor(
    sender: Address | string,
    krc20Amount: bigint,
    receiver: Address | string,
    tick: string,
    networkId: NetworkId,
    outputAmount: bigint,
    priorityFee?: Fees
  ) {
    this.sender = sender instanceof Address ? sender : Address.fromString(sender);
    this.krc20Amount = krc20Amount;
    this.receiver = receiver instanceof Address ? receiver : Address.fromString(receiver);
    this.tick = tick.toUpperCase();
    this.networkId = networkId;
    this.outputAmount = outputAmount;
    this.priorityFee = priorityFee;
  }

  setPriorityFee(priorityFee: Fees): void {
    this.priorityFee = priorityFee;
  }

  /**
   * Converts the parameters to commit transaction generator settings.
   * @param uxtos - The UTXO entries.
   * @returns The generator settings.
   */
  toCommitTxGeneratorSettings(uxtos: UtxoEntryReference[] = []): GeneratorSettings {
    const P2SHAddress = addressFromScriptPublicKey(
      this.script.createPayToScriptHashScript(),
      this.networkId.networkType
    )!;

    const output = new PaymentOutput(P2SHAddress, this.outputAmount);
    return new GeneratorSettings(output, this.sender, uxtos, this.networkId, this.priorityFee);
  }

  /**
   * Converts the parameters to reveal transaction generator settings.
   * @param uxtos - The UTXO entries.
   * @param commitTxId - The commit transaction ID.
   * @returns The generator settings.
   */
  toRevealTxGeneratorSettings(uxtos: UtxoEntryReference[] = [], commitTxId: TransactionId): GeneratorSettings {
    const P2SHAddress = addressFromScriptPublicKey(
      this.script.createPayToScriptHashScript(),
      this.networkId.networkType
    )!;
    const priorityEntries = [
      new UtxoEntryReference(
        P2SHAddress,
        new TransactionOutpoint(commitTxId, 0),
        this.outputAmount,
        this.script.createPayToScriptHashScript(),
        0n,
        false
      )
    ];
    return new GeneratorSettings([], this.sender, uxtos, this.networkId, this.priorityFee, priorityEntries);
  }

  /**
   * Gets the script builder for the transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const data = {
      p: 'krc-20',
      op: 'transfer',
      tick: this.tick,
      amt: this.krc20Amount.toString(),
      to: this.receiver.toString()
    };
    return new ScriptBuilder()
      .addData(this.sender.payload)
      .addOp(OpCodes.OpCheckSig)
      .addOp(OpCodes.OpFalse)
      .addOp(OpCodes.OpIf)
      .addData(Buffer.from('kasplex'))
      .addI64(0n)
      .addData(Buffer.from(JSON.stringify(data, null, 0)))
      .addOp(OpCodes.OpEndIf);
  }
}

export { SendKasParams, SendKrc20Params };
