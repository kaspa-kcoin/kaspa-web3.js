/**
 * Custom error class for handling subnetwork conversion errors.
 */
class SubnetworkConversionError extends Error {
  /**
   * Creates an instance of SubnetworkConversionError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'SubnetworkConversionError';
  }
}

export { SubnetworkConversionError };
