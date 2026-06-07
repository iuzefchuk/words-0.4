import { BoardAxis as Axis, InventoryLetter as Letter } from '@/domain/value-objects/enums.ts';
import type { BoardCell as Cell } from '@/domain/value-objects/types.ts';

export default class CrossCheckTable {
  static readonly ALL_LETTERS_MASK = (1 << Object.values(Letter).length) - 1;

  get buffer(): ArrayBuffer | SharedArrayBuffer {
    return this.data.buffer;
  }

  private readonly data: Uint32Array;

  private readonly yOffset: number;

  private constructor(buffer: ArrayBuffer | SharedArrayBuffer, cellCount: number) {
    this.data = new Uint32Array(buffer);
    this.yOffset = cellCount;
  }

  static create(cellCount: number): CrossCheckTable {
    const byteLength = cellCount * 2 * Uint32Array.BYTES_PER_ELEMENT;
    const buffer = typeof SharedArrayBuffer === 'undefined' ? new ArrayBuffer(byteLength) : new SharedArrayBuffer(byteLength);
    return new CrossCheckTable(buffer, cellCount);
  }

  static createFromBuffer(buffer: ArrayBuffer | SharedArrayBuffer, cellCount: number): CrossCheckTable {
    return new CrossCheckTable(buffer, cellCount);
  }

  getMask(axis: Axis, cell: Cell): number {
    const mask = this.data[(axis === Axis.X ? 0 : this.yOffset) + cell];
    if (mask === undefined) throw new ReferenceError(`expected mask for axis ${axis} cell ${String(cell)}, got undefined`);
    return mask;
  }

  setMask(axis: Axis, cell: Cell, mask: number): void {
    this.data[(axis === Axis.X ? 0 : this.yOffset) + cell] = mask;
  }
}
