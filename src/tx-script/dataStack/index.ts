import { SizedEncodeInt } from './sized-encode-int';
import { TxScriptError } from '../error';

export { OpcodeDataBool } from './opcode-data-bool';

/**
 * IDataStack defines the interface for a data stack.
 */
export interface IDataStack {
  popItems(size: number): SizedEncodeInt[];

  peekItems(size: number): SizedEncodeInt[];

  popRaw(size: number): Uint8Array[];

  peekRaw(size: number): Uint8Array[];

  pushItem(item: SizedEncodeInt): void;

  dropItems(size: number): void;

  dupItems(size: number): void;

  overItems(size: number): void;

  rotItems(size: number): void;

  swapItems(size: number): void;
}

/**
 * DataStack provides a stack implementation for byte arrays.
 */
class DataStack extends Array<Uint8Array> implements IDataStack {
  /**
   * Pops the specified number of items from the stack.
   */
  popItems(size: number): SizedEncodeInt[] {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    const items = this.slice(this.length - size).map(SizedEncodeInt.deserialize);
    this.splice(this.length - size, size);
    return items;
  }

  /**
   * Peeks the specified number of items from the stack.
   */
  peekItems(size: number): SizedEncodeInt[] {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    return this.slice(this.length - size).map(SizedEncodeInt.deserialize);
  }

  /**
   * Pops the specified number of raw byte arrays from the stack.
   */
  popRaw(size: number): Uint8Array[] {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    const items = this.slice(this.length - size);
    this.splice(this.length - size, size);
    return items;
  }

  /**
   * Peeks the specified number of raw byte arrays from the stack.
   */
  peekRaw(size: number): Uint8Array[] {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    return this.slice(this.length - size);
  }

  /**
   * Pushes an item onto the stack.
   */
  pushItem(item: SizedEncodeInt): void {
    this.push(item.serialize());
  }

  /**
   * Drops the specified number of items from the stack.
   */
  dropItems(size: number): void {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    this.splice(this.length - size, size);
  }

  /**
   * Duplicates the specified number of items on the stack.
   */
  dupItems(size: number): void {
    if (this.length < size) {
      throw new TxScriptError(`Invalid stack operation: ${size} items requested, but only ${this.length} available.`);
    }

    const items = this.slice(this.length - size);
    this.push(...items);
  }

  /**
   * Copies the specified number of items from further down the stack to the top.
   */
  overItems(size: number): void {
    if (this.length < 2 * size) {
      throw new TxScriptError(
        `Invalid stack operation: ${2 * size} items requested, but only ${this.length} available.`
      );
    }

    const items = this.slice(this.length - 2 * size, this.length - size);
    this.push(...items);
  }

  /**
   * Rotates the specified number of items in the stack.
   */
  rotItems(size: number): void {
    if (this.length < 3 * size) {
      throw new TxScriptError(
        `Invalid stack operation: ${3 * size} items requested, but only ${this.length} available.`
      );
    }

    const items = this.slice(this.length - 3 * size, this.length - 2 * size);
    this.splice(this.length - 3 * size, size);
    this.push(...items);
  }

  /**
   * Swaps the specified number of items in the stack.
   */
  swapItems(size: number): void {
    if (this.length < 2 * size) {
      throw new TxScriptError(
        `Invalid stack operation: ${2 * size} items requested, but only ${this.length} available.`
      );
    }

    const firstItems = this.slice(this.length - 2 * size, this.length - size);
    const secondItems = this.slice(this.length - size);
    this.splice(this.length - 2 * size, 2 * size, ...secondItems, ...firstItems);
  }
}

export { DataStack };
