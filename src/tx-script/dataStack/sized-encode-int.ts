/**
 * Class representing a sized encoded integer.
 */
class SizedEncodeInt {
  private readonly _value: bigint;

  /**
   * Creates an instance of SizedEncodeInt.
   * @param value - The bigint value to encode.
   */
  constructor(value: bigint) {
    this._value = value;
  }

  /**
   * Gets the value of the sized encoded integer.
   * @returns The bigint value.
   */
  get value(): bigint {
    return this._value;
  }

  /**
   * Creates a SizedEncodeInt instance from a bigint value.
   * @param value - The bigint value to encode.
   * @returns A new SizedEncodeInt instance.
   */
  static from(value: bigint): SizedEncodeInt {
    return new SizedEncodeInt(value);
  }

  /**
   * Converts a SizedEncodeInt instance to a bigint value.
   * @param sizedEncodeInt - The SizedEncodeInt instance to convert.
   * @returns The bigint value.
   */
  static toBigInt(sizedEncodeInt: SizedEncodeInt): bigint {
    return sizedEncodeInt.value;
  }

  /**
   * Deserializes a Uint8Array to a SizedEncodeInt instance.
   * @param data - The Uint8Array data to deserialize.
   * @returns A new SizedEncodeInt instance.
   * @throws Will throw an error if the data length is greater than 8 bytes or not minimally encoded.
   */
  static deserialize(data: Uint8Array): SizedEncodeInt {
    if (data.length > 8) {
      throw new Error(
        `numeric value encoded as ${Array.from(data)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')} is longer than 8 bytes`
      );
    }

    if (data.length === 0) return new SizedEncodeInt(BigInt(0));

    this.checkMinimalDataEncoding(data);

    const msb = data[data.length - 1];
    const sign = 1 - 2 * ((msb >> 7) & 1);
    const firstByte = msb & 0x7f;
    const result = Array.from(data.slice(0, -1))
      .reverse()
      .reduce((accum, item) => (accum << 8n) + BigInt(item), BigInt(firstByte));

    return new SizedEncodeInt(result * BigInt(sign));
  }

  /**
   * Serializes the SizedEncodeInt instance to a Uint8Array.
   * @returns The serialized Uint8Array.
   */
  serialize(): Uint8Array {
    const sign = this._value < 0 ? -1 : 1;
    let positive = this._value * BigInt(sign);
    let lastSaturated = false;
    const numberList: number[] = [];

    while (positive !== BigInt(0) || lastSaturated) {
      const byteValue = Number(positive & BigInt(0xff));
      lastSaturated = (byteValue & 0x80) !== 0;
      numberList.push(byteValue);
      positive >>= 8n;
    }

    if (sign === -1 && numberList.length > 0) {
      numberList[numberList.length - 1] |= 0x80;
    }

    return new Uint8Array(numberList);
  }

  /**
   * Checks if the data is minimally encoded.
   * @param data - The Uint8Array data to check.
   * @throws Will throw an error if the data is not minimally encoded.
   */
  private static checkMinimalDataEncoding(data: Uint8Array): void {
    if (data.length === 0) {
      return;
    }
    // Check that the number is encoded with the minimum possible
    // number of bytes.
    //
    // If the most-significant-byte - excluding the sign bit - is zero
    // then we're not minimal. Note how this test also rejects the
    // negative-zero encoding, [0x80].
    if ((data[data.length - 1] & 0x7f) === 0) {
      // One exception: if there's more than one byte and the most
      // significant bit of the second-most-significant-byte is set
      // it would conflict with the sign bit. An example of this case
      // is +-255, which encode to 0xff00 and 0xff80 respectively.
      // (big-endian).
      if (data.length === 1 || (data[data.length - 2] & 0x80) === 0) {
        throw new Error(
          `numeric value encoded as ${Array.from(data)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')} is not minimally encoded`
        );
      }
    }
  }
}

export { SizedEncodeInt };
