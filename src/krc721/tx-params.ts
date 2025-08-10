import { Address } from '../address';
import { NetworkId } from '../consensus';
import { RpcUtxosByAddressesEntry } from '../rpc/types';
import { Fees, UtxoEntryReference, GeneratorSettings, PaymentOutput, TransactionId, TransactionOutpoint } from '../tx';
import { ScriptBuilder, OpCodes } from '../tx/script';
import { addressFromScriptPublicKey, kaspaToSompi } from '../utils';

const COMMIT_TX_OUTPUT_AMOUNT = kaspaToSompi(0.3);

/**
 * Options for deploying a KRC-721 token collection.
 */
interface Krc721DeployOptions {
  tick: string;
  max: string;
  buri?: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      traitType: string;
      value: string | number;
      displayType?: string;
    }>;
  };
  royaltyFee?: string;
  royaltyTo?: string;
  mintDaaScore?: string;
  premint?: string;
  to?: string;
}

/**
 * Options for minting a KRC-721 token.
 */
interface Krc721MintOptions {
  tick: string;
  to?: string;
}

/**
 * Options for transferring a KRC-721 token.
 */
interface Krc721TransferOptions {
  tick: string;
  tokenId: string;
  to: string;
}

/**
 * Options for setting a discount for minting KRC-721 tokens.
 */
interface Krc721DiscountOptions {
  tick: string;
  to: string;
  discountFee: string;
}

/**
 * Union type for KRC-721 operation parameters.
 */
type Krc721OperationOptions = Krc721DeployOptions | Krc721MintOptions | Krc721TransferOptions | Krc721DiscountOptions;

/**
 * Abstract class representing KRC-721 transaction parameters.
 */
abstract class Krc721TxParams {
  sender: Address;
  outputAmount: bigint;
  commitTxPriorityFee?: Fees;
  revealPriorityFee?: Fees;
  networkId: NetworkId;
  options: Krc721OperationOptions;

  /**
   * Constructs a new Krc721TxParams instance.
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
    options: Krc721OperationOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    // Validate tick format: 1-10 alphanumeric characters
    if (!options.tick.match(/^[a-zA-Z0-9]{1,10}$/)) {
      throw new Error('Invalid tick: must be 1-10 alphanumeric characters');
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
      .addData(Buffer.from('kspr'))
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
 * Class representing the parameters for deploying a KRC-721 token collection.
 */
class Krc721DeployParams extends Krc721TxParams {
  /**
   * Constructs a new Krc721DeployParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction. KRC-721 deploy requires 1,000 KAS.
   * @param options - The deployment-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc721DeployOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    // Validate max supply (must be a positive number)
    if (BigInt(options.max) <= 0n) {
      throw new Error('max must be a positive number');
    }

    // Validate URI or metadata
    if (options.buri && options.metadata) {
      throw new Error('Cannot specify both buri and metadata');
    }

    if (options.buri && !options.buri.startsWith('ipfs://')) {
      throw new Error('buri must start with ipfs://');
    }

    if (options.metadata && !options.metadata.image.startsWith('ipfs://')) {
      throw new Error('metadata.image must start with ipfs://');
    }

    // Validate royalty fee (if specified)
    if (options.royaltyFee !== undefined) {
      const royaltyFeeValue = BigInt(options.royaltyFee);
      // 0.1 KAS to 10,000,000 KAS in sompi
      if (royaltyFeeValue < 10000000n || royaltyFeeValue > 1000000000000000n) {
        throw new Error('royaltyFee must be between 0.1 KAS and 10,000,000 KAS');
      }
    }

    // Validate premint (if specified)
    if (options.premint !== undefined) {
      const premintValue = BigInt(options.premint);
      const maxValue = BigInt(options.max);
      if (premintValue > maxValue) {
        throw new Error('premint cannot be greater than max');
      }
    }

    // Validate addresses
    if (options.to !== undefined && !Address.validate(options.to)) {
      throw new Error('Invalid to address format');
    }

    if (options.royaltyTo !== undefined && !Address.validate(options.royaltyTo)) {
      throw new Error('Invalid royaltyTo address format');
    }

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the deployment transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const options = this.options as Krc721DeployOptions;
    const data: Record<string, any> = {
      p: 'krc-721',
      op: 'deploy',
      tick: options.tick,
      max: options.max
    };

    // Add optional fields if they exist
    if (options.buri) data.buri = options.buri;
    if (options.metadata) data.metadata = options.metadata;
    if (options.royaltyFee) data.royaltyFee = options.royaltyFee;
    if (options.royaltyTo) data.royaltyTo = options.royaltyTo;
    if (options.mintDaaScore) data.mintDaaScore = options.mintDaaScore;
    if (options.premint) data.premint = options.premint;
    if (options.to) data.to = options.to;

    return this.getScriptBuilder(data);
  }
}

/**
 * Class representing the parameters for minting a KRC-721 token.
 */
class Krc721MintParams extends Krc721TxParams {
  /**
   * Constructs a new Krc721MintParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction. KRC-721 mint requires 10 KAS.
   * @param options - The minting-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc721MintOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    // Validate 'to' address if provided
    if (options.to !== undefined && !Address.validate(options.to)) {
      throw new Error('Invalid to address format');
    }

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the minting transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, to } = this.options as Krc721MintOptions;
    const data: Record<string, any> = { p: 'krc-721', op: 'mint', tick };

    if (to) data.to = to;

    return this.getScriptBuilder(data);
  }
}

/**
 * Class representing the parameters for transferring a KRC-721 token.
 */
class Krc721TransferParams extends Krc721TxParams {
  /**
   * Constructs a new Krc721TransferParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction.
   * @param options - The transfer-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc721TransferOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    // Validate token ID
    if (!options.tokenId) {
      throw new Error('Token ID is required');
    }
    const tokenIdNum = Number(options.tokenId);
    if (!Number.isInteger(tokenIdNum) || tokenIdNum < 0) {
      throw new Error('Invalid token ID');
    }

    // Validate recipient address
    if (!Address.validate(options.to)) {
      throw new Error('Invalid recipient address format');
    }

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the transfer transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, tokenId, to } = this.options as Krc721TransferOptions;
    const data = { p: 'krc-721', op: 'transfer', tick, tokenId, to };
    return this.getScriptBuilder(data);
  }
}

/**
 * Class representing the parameters for setting a discount on a KRC-721 token.
 */
class Krc721DiscountParams extends Krc721TxParams {
  /**
   * Constructs a new Krc721DiscountParams instance.
   * @param sender - The sender's address.
   * @param networkId - The network ID.
   * @param revealTxPriorityFee - The priority fee for the reveal transaction.
   * @param options - The discount-specific parameters.
   * @param commitTxPriorityFee - The priority fee for the commit transaction. Defaults to 0 KAS.
   * @param commitTxOutputAmount - The output amount for the commit transaction. Defaults to 0.3 KAS.
   */
  constructor(
    sender: Address,
    networkId: NetworkId,
    revealTxPriorityFee: Fees,
    options: Krc721DiscountOptions,
    commitTxPriorityFee: Fees = Fees.from(0n),
    commitTxOutputAmount: bigint = COMMIT_TX_OUTPUT_AMOUNT
  ) {
    // Validate discount fee
    if (!options.discountFee || BigInt(options.discountFee) <= 0n) {
      throw new Error('Invalid discount fee');
    }

    // Validate recipient address
    if (!Address.validate(options.to)) {
      throw new Error('Invalid recipient address format');
    }

    super(sender, networkId, revealTxPriorityFee, options, commitTxPriorityFee, commitTxOutputAmount);
  }

  /**
   * Gets the script builder for the discount transaction.
   * @returns The script builder.
   */
  get script(): ScriptBuilder {
    const { tick, to, discountFee } = this.options as Krc721DiscountOptions;
    const data = { p: 'krc-721', op: 'discount', tick, to, discountFee };
    return this.getScriptBuilder(data);
  }
}

export { Krc721DeployParams, Krc721MintParams, Krc721TransferParams, Krc721DiscountParams, Krc721TxParams };
export type {
  Krc721DeployOptions,
  Krc721MintOptions,
  Krc721TransferOptions,
  Krc721DiscountOptions,
  Krc721OperationOptions
};
