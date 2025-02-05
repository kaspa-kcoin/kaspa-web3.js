/**
 * TxScriptError represents various script errors.
 */
class TxScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TxScriptError';
  }
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
