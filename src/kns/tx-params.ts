import { Address } from '../address';
import { NetworkId, NetworkType } from '../consensus';
import { RpcUtxosByAddressesEntry } from '../rpc/types';
import { Fees, GeneratorSettings, PaymentOutput, TransactionId, TransactionOutpoint, UtxoEntryReference } from '../tx';
import { OpCodes, ScriptBuilder } from '../tx/script';
import { addressFromScriptPublicKey, kaspaToSompi } from '../utils';
import GraphemeSplitter from 'grapheme-splitter';

const COMMIT_TX_OUTPUT_AMOUNT = kaspaToSompi(0.3);
const KNS_PAYOUT_ADDRESS = {
  [NetworkType.Mainnet]: 'kaspa:qyp4nvaq3pdq7609z09fvdgwtc9c7rg07fuw5zgeee7xpr085de59eseqfcmynn',
  [NetworkType.Testnet]: 'kaspatest:qq9h47etjv6x8jgcla0ecnp8mgrkfxm70ch3k60es5a50ypsf4h6sak3g0lru'
};

/**
 * Options for transferring a KNS domain.
 */
interface KnsTransferOptions {
  id: string;
  to: string;
}

/**
 * Options for creating a KNS domain.
 * The fee is automatically calculated based on the domain length:
 * - 1-2 characters: 420,000,000,000 sompi
 * - 3 characters: 210,000,000,000 sompi
 * - 4 characters: 52,500,000,000 sompi
 * - 5+ characters: 3,500,000,000 sompi
 */
interface KnsCreateOptions {
  domain: string;
}

/**
 * Union type for KNS operation parameters.
 */
type KnsOperationOptions = KnsTransferOptions | KnsCreateOptions;

/**
 * Abstract class representing KNS transaction parameters.
 */
abstract class KnsTxParams {
  sender: Address;
  outputAmount: bigint;
  commitTxPriorityFee?: Fees;
  revealPriorityFee?: Fees;
  revealOutputs?: PaymentOutput[];
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
    return new GeneratorSettings(
      this.revealOutputs ?? [],
      this.sender,
      uxtos,
      this.networkId,
      this.revealPriorityFee,
      priorityEntries
    );
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

/**
 * Class representing the parameters for creating a KNS domain.
 */
class KnsCreateParams extends KnsTxParams {
  /**
   * Constructs a new KnsCreateParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction.
   * @param options - The create-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address | string,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: KnsCreateOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);

    // Calculate the priority fee based on domain length
    const splitter = new GraphemeSplitter();
    const domainLength = splitter.countGraphemes(options.domain);
    const payoutAddress = networkId.isMainnet()
      ? KNS_PAYOUT_ADDRESS[NetworkType.Mainnet]
      : KNS_PAYOUT_ADDRESS[NetworkType.Testnet];

    if (domainLength <= 2) {
      this.revealOutputs = [
        {
          amount: 420000000000n,
          address: Address.fromString(payoutAddress)
        }
      ];
    } else if (domainLength === 3) {
      this.revealOutputs = [
        {
          amount: 210000000000n,
          address: Address.fromString(payoutAddress)
        }
      ];
    } else if (domainLength === 4) {
      this.revealOutputs = [
        {
          amount: 52500000000n,
          address: Address.fromString(payoutAddress)
        }
      ];
    } else {
      this.revealOutputs = [
        {
          amount: 3500000000n,
          address: Address.fromString(payoutAddress)
        }
      ];
    }
  }

  /**
   * Gets the script builder for the domain creation transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { domain } = this.options as KnsCreateOptions;
    const data = JSON.stringify({ op: 'create', p: 'domain', v: domain }, null, 0);
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

export { KnsTransferParams, KnsTxParams, KnsCreateParams };
export type { KnsTransferOptions, KnsCreateOptions };
