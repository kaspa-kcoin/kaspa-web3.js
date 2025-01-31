import { TxScriptError } from "../tx-script";

 

/**
 * Constructor error types
 */
export enum ConstructorErrorType {
  InputNotModifiable = 'InputNotModifiable',
  OutputNotModifiable = 'OutputNotModifiable'
}

export class ConstructorError extends Error {
  constructor(public type: ConstructorErrorType) {
    super(type);
    this.name = 'ConstructorError';
  }
}

/**
 * Conversion error types
 */
export enum ConversionErrorType {
  InvalidOutput = 'InvalidOutput'
}

export class ConversionError extends Error {
  constructor(public type: ConversionErrorType) {
    super(type);
    this.name = 'ConversionError';
  }
}

/**
 * Main PSKT error types
 */
export class PSKTError extends Error {
  constructor(
    public readonly type: 
      | 'Custom'
      | 'ConstructorError' 
      | 'OutOfBounds'
      | 'MissingUtxoEntry'
      | 'MissingRedeemScript'
      | 'InputBuilder'
      | 'OutputBuilder'
      | 'HexDecodeError'
      | 'JsonDeserializeError'
      | 'PskbSerializeError'
      | 'MultipleUnlockUtxoError'
      | 'ExcessUnlockFeeError'
      | 'TxToInnerConversionError'
      | 'TxToInnerConversionInputBuildingError'
      | 'P2SHExtractError'
      | 'PskbSerializeToHexError'
      | 'PskbPrefixError'
      | 'PsktPrefixError',
    public readonly cause?: Error,
    message?: string
  ) {
    super(message || `PSKT Error: ${type}`);
    this.name = 'PSKTError';
  }

  public static fromString(message: string): PSKTError {
    return new PSKTError('Custom', undefined, message);
  }

  public static fromConstructor(error: ConstructorError): PSKTError {
    return new PSKTError('ConstructorError', error);
  }

  public static fromInputBuilder(error: InputBuilderError): PSKTError {
    return new PSKTError('InputBuilder', error);
  }

  public static fromOutputBuilder(error: OutputBuilderError): PSKTError {
    return new PSKTError('OutputBuilder', error);
  }

  public static fromTxScript(error: TxScriptError): PSKTError {
    return new PSKTError('P2SHExtractError', error);
  }
}

// Type guards
export const isConstructorError = (error: Error): error is ConstructorError => 
  error instanceof ConstructorError;

export const isPSKTError = (error: Error): error is PSKTError =>
  error instanceof PSKTError;

export const isConversionError = (error: Error): error is ConversionError =>
  error instanceof ConversionError;