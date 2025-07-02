import { Address } from '../address';
import { NetworkId } from '../consensus';
import { RpcUtxosByAddressesEntry } from '../rpc/types';
import { Fees, GeneratorSettings, PaymentOutput, TransactionId, TransactionOutpoint, UtxoEntryReference } from '../tx';
import { OpCodes, ScriptBuilder } from '../tx/script';
import { addressFromScriptPublicKey, kaspaToSompi } from '../utils';

const COMMIT_TX_OUTPUT_AMOUNT = kaspaToSompi(0.3);

/**
 * Options for transferring a KNS domain.
 */
interface KnsTransferOptions {
  id: string;
  to: string;
}

/**
 * Union type for KNS operation parameters.
 */
type KnsOperationOptions = KnsTransferOptions;

/**
 * Abstract class representing KNS transaction parameters.
 */
abstract class KnsTxParams {
  sender: Address;
  outputAmount: bigint;
  commitTxPriorityFee?: Fees;
  revealPriorityFee?: Fees;
  networkId: NetworkId;
  options: KnsOperationOptions;

  /**
   * Constructs a new KnsTxParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealPriorityFee - The optional priority fee, it required for reveal transaction.
   * @param options - The operation-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  protected constructor(
    sender: Address | string,
    networkId: NetworkId,
    revealPriorityFee: Fees,
    options: KnsOperationOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    this.sender = typeof sender === 'string' ? Address.fromString(sender) : sender;
    this.networkId = networkId;
    this.outputAmount = commitTxOutputAmount;
    this.options = options;
    this.commitTxPriorityFee = commitTxPriorityFee;
    this.revealPriorityFee = revealPriorityFee;
  }

  /**
   * Abstract method to get the script builder for the transaction.
   * @returns The script builder.
   */
  abstract get script(): ScriptBuilder;

  /**
   * Gets the P2SH address for the transaction.
   * @returns The P2SH address.
   */
  get p2shAddress(): Address {
    return addressFromScriptPublicKey(this.script.createPayToScriptHashScript(), this.networkId.networkType)!;
  }

  /**
   * Converts the parameters to commit transaction generator settings.
   * @param uxtos - The UTXO entries.
   * @returns The generator settings.
   */
  toCommitTxGeneratorSettings(uxtos: UtxoEntryReference[] | RpcUtxosByAddressesEntry[] = []): GeneratorSettings {
    const P2SHAddress = addressFromScriptPublicKey(
      this.script.createPayToScriptHashScript(),
      this.networkId.networkType
    )!;

    const output = new PaymentOutput(P2SHAddress, this.outputAmount);
    return new GeneratorSettings(output, this.sender, uxtos, this.networkId, this.commitTxPriorityFee);
  }

  /**
   * Converts the parameters to reveal transaction generator settings.
   * @param uxtos - The UTXO entries.
   * @param commitTxId - The commit transaction ID.
   * @returns The generator settings.
   */
  toRevealTxGeneratorSettings(
    uxtos: UtxoEntryReference[] | RpcUtxosByAddressesEntry[] = [],
    commitTxId: TransactionId
  ): GeneratorSettings {
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
    return new GeneratorSettings([], this.sender, uxtos, this.networkId, this.revealPriorityFee, priorityEntries);
  }
}

/**
 * Class representing the parameters for transferring a KNS domain.
 */
class KnsTransferParams extends KnsTxParams {
  /**
   * Constructs a new KnsTransferParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction.
   * @param options - The transfer-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address | string,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: KnsTransferOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    if (!Address.validate(options.to)) throw new Error('Invalid address format');

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the domain transfer transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { id, to } = this.options as KnsTransferOptions;
    const data = JSON.stringify({ op: 'transfer', p: 'domain', id, to }, null, 0);
    const buf = Buffer.from(data);

    return new ScriptBuilder()
      .addData(this.sender.payload)
      .addOp(OpCodes.OpCheckSig)
      .addOp(OpCodes.OpFalse)
      .addOp(OpCodes.OpIf)
      .addData(Buffer.from('kns'))
      .addI64(0n)
      .addData(buf)
      .addOp(OpCodes.OpEndIf);
  }
}

export { KnsTransferParams, KnsTxParams };
export type { KnsTransferOptions };
