/**
 * Class representing an OpcodeDataBool.
 * Provides methods to serialize and deserialize boolean data.
 */
class OpcodeDataBool {
  /**
   * Deserializes a Uint8Array into a boolean.
   * @param {Uint8Array} data - The data to deserialize.
   * @returns {boolean} - The deserialized boolean value.
   */
  deserialize(data: Uint8Array): boolean {
    if (data.length === 0) {
      return false;
    }

    // Negative 0 is also considered false
    return (data[data.length - 1] & 0x7f) !== 0x0 || Array.from(data.slice(0, -1)).some((b) => b !== 0x0);
  }

  /**
   * Serializes a boolean into a Uint8Array.
   * @param {boolean} data - The boolean to serialize.
   * @returns {Uint8Array} - The serialized data.
   */
  serialize(data: boolean): Uint8Array {
    return data ? new Uint8Array([1]) : new Uint8Array();
  }
}

/**
 * Export the OpcodeDataBool class.
 */
export { OpcodeDataBool };
