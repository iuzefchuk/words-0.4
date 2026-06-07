import CrossCheckTable from '@/domain/value-objects/classes/CrossCheckTable.ts';
import { BoardAxis } from '@/domain/value-objects/enums.ts';
import type Board from '@/domain/entities/Board.ts';
import type Inventory from '@/domain/entities/Inventory.ts';
import type { BoardAnchorCoordinates, BoardCell, DictionaryGraph } from '@/domain/value-objects/types.ts';

export default class CrossCheckService {
  private constructor(
    private readonly board: Board,
    private readonly dictionary: DictionaryGraph,
    private readonly inventory: Inventory,
  ) {}

  static precompute(board: Board, dictionary: DictionaryGraph, inventory: Inventory): CrossCheckTable {
    const service = new CrossCheckService(board, dictionary, inventory);
    const table = CrossCheckTable.create(board.cells.length);
    for (const axis of Object.values(BoardAxis)) {
      for (const cell of board.cells) {
        table.setMask(axis, cell, service.computeFor({ axis, cell }));
      }
    }
    return table;
  }

  private collectAdjacentTileLetters(axisCells: ReadonlyArray<BoardCell>, startPosition: number, direction: -1 | 1): string {
    let result = '';
    for (let idx = startPosition + direction; idx >= 0 && idx < axisCells.length; idx += direction) {
      const cell = axisCells[idx];
      if (cell === undefined) throw new ReferenceError(`expected cell at index ${String(idx)}, got undefined`);
      const tile = this.board.findTileByCell(cell);
      if (tile === undefined) break;
      const letter = this.inventory.getTileLetter(tile);
      result = direction === -1 ? letter + result : result + letter;
    }
    return result;
  }

  private computeFor(coords: BoardAnchorCoordinates): number {
    const axisCells = this.board.getAxisCells(coords);
    const position =
      coords.axis === BoardAxis.X
        ? this.board.getCellPositionInColumn(coords.cell)
        : this.board.getCellPositionInRow(coords.cell);
    const prefix = this.collectAdjacentTileLetters(axisCells, position, -1);
    const suffix = this.collectAdjacentTileLetters(axisCells, position, 1);
    if (prefix === '' && suffix === '') return CrossCheckTable.ALL_LETTERS_MASK;
    const prefixNode = prefix !== '' ? this.dictionary.getNode(prefix) : this.dictionary.rootNode;
    if (prefixNode === null) return 0;
    let mask = 0;
    this.dictionary.forEachNodeChild(prefixNode, (_letter, nodeWithPossibleNextLetter, letterIndex) => {
      if (suffix === '') {
        mask |= 1 << letterIndex;
        return;
      }
      const suffixNode = this.dictionary.getNode(suffix, nodeWithPossibleNextLetter);
      if (suffixNode !== null && this.dictionary.isNodeFinal(suffixNode)) mask |= 1 << letterIndex;
    });
    return mask;
  }
}
