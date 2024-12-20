import {Buffer} from "buffer";

/**
 * Size of the hash in bytes.
 */
const HASH_SIZE = 32;

/**
 * Class representing a Hash.
 * @remarks this is a wrapper around a byte array representing a 32-bytes hash.
 */
class Hash {
    private readonly value: Uint8Array;

    /**
     * Creates an instance of Hash.
     * @param {Uint8Array} value - The byte array representing the hash.
     * @throws {Error} If the length of the value is not equal to HASH_SIZE.
     */
    constructor(value: Uint8Array) {
        if (value.length !== HASH_SIZE) {
            throw new Error(`Slice must have the length of ${HASH_SIZE}`);
        }
        this.value = value;
    }

    /**
     * Creates a Hash instance from a byte array.
     * @param {Uint8Array} bytes - The byte array.
     * @returns {Hash} The Hash instance.
     */
    static fromBytes(bytes: Uint8Array): Hash {
        return new Hash(bytes);
    }

    /**
     * Creates a Hash instance from a hexadecimal string.
     * @param {string} hexStr - The hexadecimal string.
     * @returns {Hash} The Hash instance.
     */
    static fromHex(hexStr: string): Hash {
        const bytes = Buffer.from(hexStr, "hex");
        return new Hash(bytes);
    }

    /**
     * Creates a Hash instance from a 64-bit unsigned integer.
     * @param {bigint} word - The 64-bit unsigned integer.
     * @returns {Hash} The Hash instance.
     */
    static fromU64Word(word: bigint): Hash {
        const bytes = new Uint8Array(HASH_SIZE);
        const wordBytes = new DataView(new ArrayBuffer(8));
        wordBytes.setBigUint64(0, word, true);
        bytes.set(new Uint8Array(wordBytes.buffer), HASH_SIZE - 8);
        return new Hash(bytes);
    }

    /**
     * Converts the Hash instance to a byte array.
     * @returns {Uint8Array} The byte array.
     */
    toBytes(): Uint8Array {
        return this.value;
    }

    /**
     * Converts the Hash instance to a hexadecimal string.
     * @returns {string} The hexadecimal string.
     */
    toHex(): string {
        return  Buffer.from(this.value).toString("hex");
    }

    /**
     * Converts the Hash instance to a little-endian 64-bit unsigned integer array.
     * @returns {BigUint64Array} The little-endian 64-bit unsigned integer array.
     */
    toLeU64(): BigUint64Array {
        const result = new BigUint64Array(4);
        for (let i = 0; i < 4; i++) {
            result[i] = new DataView(this.value.buffer, i * 8, 8).getBigUint64(0, true);
        }
        return result;
    }

    /**
     * Creates a Hash instance from a little-endian 64-bit unsigned integer array.
     * @param {BigUint64Array} arr - The little-endian 64-bit unsigned integer array.
     * @returns {Hash} The Hash instance.
     */
    static fromLeU64(arr: BigUint64Array): Hash {
        const bytes = new Uint8Array(HASH_SIZE);
        for (let i = 0; i < 4; i++) {
            const wordBytes = new DataView(new ArrayBuffer(8));
            wordBytes.setBigUint64(0, arr[i], true);
            bytes.set(new Uint8Array(wordBytes.buffer), i * 8);
        }
        return new Hash(bytes);
    }

    /**
     * Checks if the Hash instance is equal to another Hash instance.
     * @param {Hash} other - The other Hash instance.
     * @returns {boolean} True if the Hash instances are equal, otherwise false.
     */
    equals(other: Hash): boolean {
        return this.value.every((byte, index) => byte === other.value[index]);
    }

    /**
     * Converts the Hash instance to a string.
     * @returns {string} The string representation of the Hash instance.
     */
    toString(): string {
        return this.toHex();
    }

    /**
     * Creates a Hash instance from a string.
     * @param {string} hexStr - The string.
     * @returns {Hash} The Hash instance.
     */
    static fromString(hexStr: string): Hash {
        return Hash.fromHex(hexStr);
    }
}

const ZERO_HASH = new Hash(new Uint8Array(HASH_SIZE).fill(0));

export {Hash, HASH_SIZE, ZERO_HASH};
