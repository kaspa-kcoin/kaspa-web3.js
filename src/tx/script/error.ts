import { OpCode, OpCodes } from './op-codes';

/**
 * TxScriptError represents various script errors.
 */
class TxScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TxScriptError';
  }

  static throwMalformedPush(code: OpCodes | OpCode, length: number) {
    throw new TxScriptError(`opcode requires ${getCodeValue(code)} bytes, but script only has ${length} remaining`);
  }

  static throwVerifyError() {
    throw new TxScriptError('script ran, but verification failed');
  }

  static throwOpcodeReservedError(code: OpCodes | OpCode) {
    throw new TxScriptError(`attempt to execute reserved opcode ${getCodeValue(code)}`);
  }

  static throwOpcodeDisabledError(code: OpCodes | OpCode) {
    throw new TxScriptError(`attempt to execute disabled opcode ${getCodeValue(code)}`);
  }

  static throwInvalidSourceError(codeName: string) {
    throw new TxScriptError(`opcode not supported on current source: ${codeName} only applies to transaction inputs`);
  }

  static throwInvalidOpcode(code: OpCodes | OpCode) {
    throw new TxScriptError(`attempt to execute invalid opcode ${getCodeValue(code)}`);
  }

  static throwEmptyStackError() {
    throw new TxScriptError('attempt to read from empty stack');
  }

  static throwCleanStackError(size: number) {
    throw new TxScriptError(`stack contains ${size} unexpected items`);
  }

  static throwInvalidStateError(msg: string) {
    throw new TxScriptError(`encountered invalid state while running script: ${msg}`);
  }

  static throwEvalFalseError() {
    throw new TxScriptError('false stack entry at end of script execution');
  }

  static throwErrUnbalancedConditional() {
    throw new TxScriptError('end of script reached in conditional execution');
  }

  static throwPubKeyFormat() {
    throw new TxScriptError('unsupported public key type');
  }

  static throwInvalidPubKeyCount(detail: string) {
    throw new TxScriptError(`invalid pubkey count: ${detail}`);
  }

  static throwInvalidStackOperation(dataLength: number, stackLength: number) {
    throw new TxScriptError(`opcode requires at least ${dataLength} but stack has only ${stackLength}`);
  }

  static throwNumberTooBig(detail: string) {
    throw new TxScriptError(`Number too big: ${detail}`);
  }

  static throwEarlyReturn() {
    throw new TxScriptError('script returned early');
  }

  static throwInvalidInputIndex(idx: number, length: number) {
    throw new TxScriptError(`transaction input ${idx} is out of bounds, should be non-negative below ${length}`);
  }

  static throwInvalidOutputIndex(idx: number, length: number) {
    throw new TxScriptError(`transaction output ${idx} is out of bounds, should be non-negative below ${length}`);
  }

  static throwNotMinimalData(detail: string) {
    throw new TxScriptError(`push encoding is not minimal: ${detail}`);
  }

  static throwMalformedPushSize(bytes: Uint8Array) {
    throw new TxScriptError(`invalid opcode length: ${Buffer.from(bytes).toString('hex')}`);
  }

  static throwTooManyOperations(opCount: number) {
    throw new TxScriptError(`exceeded max operation limit of ${opCount}`);
  }

  static throwStackSizeExceeded(size: number, maxSize: number) {
    throw new TxScriptError(`combined stack size ${size} > max allowed ${maxSize}`);
  }

  static throwScriptSize(size: number, maxSize: number) {
    throw new TxScriptError(`script of size ${size} exceeded maximum allowed size of ${maxSize}`);
  }

  static throwInvalidSignatureCount(detail: string) {
    throw new TxScriptError(`invalid signature count: ${detail}`);
  }

  static throwSigLength(sigLen: number) {
    throw new TxScriptError(`invalid signature length ${sigLen}`);
  }

  static throwSignatureScriptNotPushOnly() {
    throw new TxScriptError('signature script is not push only');
  }

  static throwUnsatisfiedLockTime(detail: string) {
    throw new TxScriptError(`Unsatisfied lock time: ${detail}`);
  }
}

function getCodeValue(code: OpCode | OpCodes): number {
  if (code instanceof OpCode) {
    return code.value();
  }
  return code.valueOf();
}

/**
 * SerializationError represents errors during serialization.
 */
class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

/**
 * ScriptBuilderError is thrown when an error occurs while building a script.
 */
class ScriptBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptBuilderError';
  }
}

/**
 * MultisigCreateError is thrown when an error occurs while building a multisig script.
 */
class MultisigCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MultiSigError';
  }
}

export { TxScriptError, SerializationError, ScriptBuilderError, MultisigCreateError };
