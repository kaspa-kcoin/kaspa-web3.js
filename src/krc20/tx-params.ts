import { Address } from '../address';
import { NetworkId } from '../consensus';
import { RpcUtxosByAddressesEntry } from '../rpc/types';
import { Fees, GeneratorSettings, PaymentOutput, TransactionId, TransactionOutpoint, UtxoEntryReference } from '../tx';
import { OpCodes, ScriptBuilder } from '../tx/script';
import { addressFromScriptPublicKey, kaspaToSompi } from '../utils';
import { validateU64, validateU8 } from '../validator.ts';

const COMMIT_TX_OUTPUT_AMOUNT = kaspaToSompi(0.3);

/**
 * Options for deploying a KRC-20 token.
 */
interface Krc20DeployOptions {
  tick: string;
  max: bigint;
  lim: bigint;
  to?: string;
  dec?: number;
  pre?: bigint;
}

/**
 * Options for minting a KRC-20 token.
 */
interface Krc20MintOptions {
  tick: string;
  to?: string;
}

/**
 * Options for transferring a KRC-20 token.
 * Either tick or ca must be provided, but not both.
 */
interface Krc20TransferOptions {
  tick?: string;
  ca?: string;
  to: string;
  amount: bigint;
}

/**
 * Union type for KRC-20 operation parameters.
 */
type Krc20OperationOptions = Krc20DeployOptions | Krc20MintOptions | Krc20TransferOptions;

/**
 * Abstract class representing KRC-20 transaction parameters.
 */
abstract class Krc20TxParams {
  sender: Address;
  outputAmount: bigint;
  commitTxPriorityFee?: Fees;
  revealPriorityFee?: Fees;
  networkId: NetworkId;
  options: Krc20OperationOptions;

  /**
   * Constructs a new Krc20TxParams instance.
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
    options: Krc20OperationOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    const hasCa = 'ca' in options && typeof options.ca === 'string' && options.ca.length > 0;
    const hasTick = typeof options.tick === 'string' && options.tick.length > 0;

    if (hasCa && hasTick) {
      throw new Error('Cannot specify both tick and ca');
    }
    if (!hasCa && !hasTick) {
      throw new Error('Must specify either tick or ca');
    }
    if (hasCa) {
      if (!/^[a-zA-Z0-9]{64}$/.test(options.ca!)) {
        throw new Error('Invalid ca format');
      }
    }
    if (hasTick) {
      if (!/^[a-zA-Z]{4,6}$/.test(options.tick!)) {
        throw new Error('Invalid tick');
      }
    }

    this.sender = typeof sender === 'string' ? Address.fromString(sender) : sender;
    this.networkId = networkId;
    this.outputAmount = commitTxOutputAmount;
    this.options = options;
    this.commitTxPriorityFee = commitTxPriorityFee;
    this.revealPriorityFee = revealPriorityFee;
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

  /**
   * Abstract method to get the script builder for the transaction.
   * @returns The script builder.
   */
  abstract get script(): ScriptBuilder;

  /**
   * Helper method to create a script builder with the given data.
   * @param data - The data to include in the script.
   * @returns The script builder.
   */
  protected getScriptBuilder = (data: object): ScriptBuilder => {
    return new ScriptBuilder()
      .addData(this.sender.payload)
      .addOp(OpCodes.OpCheckSig)
      .addOp(OpCodes.OpFalse)
      .addOp(OpCodes.OpIf)
      .addData(Buffer.from('kasplex'))
      .addI64(0n)
      .addData(Buffer.from(JSON.stringify(data, null, 0)))
      .addOp(OpCodes.OpEndIf);
  };

  /**
   * Gets the P2SH address for the transaction.
   * @returns The P2SH address.
   */
  get p2shAddress(): Address {
    return addressFromScriptPublicKey(this.script.createPayToScriptHashScript(), this.networkId.networkType)!;
  }
}

/**
 * Class representing the parameters for deploying a KRC-20 token.
 */
class Krc20DeployParams extends Krc20TxParams {
  /**
   * Constructs a new Krc20DeployParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction, krc20 deploy requires $1000 KAS.
   * @param options - The deployment-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc20DeployOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    if (options.max < options.lim) throw new Error('max must be greater than or equal to lim');
    if (options.dec !== undefined) validateU8(options.dec, 'options.dec');
    if (options.pre !== undefined) validateU64(options.pre, 'options.pre');
    if (options.to != undefined && !Address.validate(options.to)) throw new Error('Invalid address format');

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the deployment transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, max, lim, to, dec, pre } = this.options as Krc20DeployOptions;
    const data = { p: 'krc-20', op: 'deploy', tick: tick, max: max.toString(), lim: lim.toString() } as any;
    if (to) data['to'] = to;
    if (dec) data['dec'] = dec;
    if (pre) data['pre'] = pre.toString();
    return this.getScriptBuilder(data);
  }
}

/**
 * Class representing the parameters for minting a KRC-20 token.
 */
class Krc20MintParams extends Krc20TxParams {
  /**
   * Constructs a new Krc20MintParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction, krc20 mint requires $1 KAS.
   * @param options - The minting-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc20MintOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    if (options.to != undefined && !Address.validate(options.to)) throw new Error('Invalid address format');

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the minting transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, to } = this.options as Krc20MintOptions;
    const data = { p: 'krc-20', op: 'mint', tick: tick } as any;
    if (to) data['to'] = to;
    return this.getScriptBuilder(data);
  }
}

/**
 * Class representing the parameters for transferring a KRC-20 token.
 */
class Krc20TransferParams extends Krc20TxParams {
  /**
   * Constructs a new Krc20TransferParams instance.
   * @param sender - The sender's address or string.
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
    options: Krc20TransferOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    if (options.amount <= 0n) throw new Error('amount must be greater than 0');
    if (!Address.validate(options.to)) throw new Error('Invalid address format');
    if (options.tick !== undefined && options.ca !== undefined) throw new Error('Cannot specify both tick and ca');
    if (options.tick === undefined && options.ca === undefined) throw new Error('Must specify either tick or ca');

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the transfer transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, ca, to, amount } = this.options as Krc20TransferOptions;
    const data = {
      p: 'krc-20',
      op: 'transfer',
      ...(tick && { tick }),
      ...(ca && { ca }),
      amt: amount.toString(),
      to
    } as any;
    return this.getScriptBuilder(data);
  }
}

export { Krc20DeployParams, Krc20MintParams, Krc20TransferParams, Krc20TxParams };
export type { Krc20DeployOptions, Krc20MintOptions, Krc20TransferOptions };
