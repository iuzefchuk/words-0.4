import { GameAxis } from '@/domain/enums.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { GameCell } from '@/domain/types/index.ts';

export default class CrossCheckTable {
  static readonly ALL_LETTERS_MASK = (1 << 26) - 1;

  static readonly BYTE_LENGTH = LayoutService.CELLS_PER_LAYOUT * 2 * Uint32Array.BYTES_PER_ELEMENT;

  private static readonly Y_OFFSET = LayoutService.CELLS_PER_LAYOUT;

  get buffer(): ArrayBuffer | SharedArrayBuffer {
    return this.data.buffer;
  }

  private readonly data: Uint32Array;

  private constructor(buffer: ArrayBuffer | SharedArrayBuffer) {
    this.data = new Uint32Array(buffer);
  }

  static create(): CrossCheckTable {
    return new CrossCheckTable(new SharedArrayBuffer(CrossCheckTable.BYTE_LENGTH));
  }

  static fromBuffer(buffer: ArrayBuffer | SharedArrayBuffer): CrossCheckTable {
    return new CrossCheckTable(buffer);
  }

  getMask(axis: GameAxis, cell: GameCell): number {
    const mask = this.data[(axis === GameAxis.X ? 0 : CrossCheckTable.Y_OFFSET) + cell];
    if (mask === undefined) throw new ReferenceError(`expected mask for axis ${axis} cell ${String(cell)}, got undefined`);
    return mask;
  }

  setMask(axis: GameAxis, cell: GameCell, mask: number): void {
    this.data[(axis === GameAxis.X ? 0 : CrossCheckTable.Y_OFFSET) + cell] = mask;
  }
}
