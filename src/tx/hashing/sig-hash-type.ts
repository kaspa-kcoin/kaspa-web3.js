class SigHashType {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  isSighashAll(): boolean {
    return (this.value & SIG_HASH_MASK) === SIG_HASH_ALL.value;
  }

  isSighashNone(): boolean {
    return (this.value & SIG_HASH_MASK) === SIG_HASH_NONE.value;
  }

  isSighashSingle(): boolean {
    return (this.value & SIG_HASH_MASK) === SIG_HASH_SINGLE.value;
  }

  isSighashAnyoneCanPay(): boolean {
    return (this.value & SIG_HASH_ANY_ONE_CAN_PAY.value) === SIG_HASH_ANY_ONE_CAN_PAY.value;
  }

  static fromU8(val: number): SigHashType | Error {
    if (!ALLOWED_SIG_HASH_TYPES_VALUES.includes(val)) {
      throw new Error('invalid sighash type');
    }
    return new SigHashType(val);
  }
}

const SIG_HASH_ALL = new SigHashType(0b00000001);
const SIG_HASH_NONE = new SigHashType(0b00000010);
const SIG_HASH_SINGLE = new SigHashType(0b00000100);
const SIG_HASH_ANY_ONE_CAN_PAY = new SigHashType(0b10000000);

/**
 * SIG_HASH_MASK defines the number of bits of the hash type which are used
 * to identify which outputs are signed.
 */
const SIG_HASH_MASK = 0b00000111;

const ALLOWED_SIG_HASH_TYPES_VALUES = [
  SIG_HASH_ALL,
  SIG_HASH_NONE,
  SIG_HASH_SINGLE,
  SIG_HASH_ALL.value | SIG_HASH_ANY_ONE_CAN_PAY.value,
  SIG_HASH_NONE.value | SIG_HASH_ANY_ONE_CAN_PAY.value,
  SIG_HASH_SINGLE.value | SIG_HASH_ANY_ONE_CAN_PAY.value
];
export { SigHashType, SIG_HASH_ALL, SIG_HASH_NONE, SIG_HASH_SINGLE, SIG_HASH_ANY_ONE_CAN_PAY, SIG_HASH_MASK };
