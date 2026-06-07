import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { BoardCell, BoardPlacement, InventoryTile } from '@/domain/value-objects/types.ts';

export default class CellsValidationService {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    historyHasPriorTurns: boolean,
    resolvePlacement: (tiles: ReadonlyArray<InventoryTile>) => BoardPlacement,
    isCellCenter: (cell: BoardCell) => boolean,
    getAdjacentCells: (cell: BoardCell) => ReadonlyArray<BoardCell>,
    isCellOccupied: (cell: BoardCell) => boolean,
  ): ReadonlyArray<BoardCell> | TurnValidationError {
    if (tiles.length === 0) return TurnValidationError.InvalidTilePlacement;
    const placement = resolvePlacement(tiles);
    const cells = placement.map(link => link.cell);
    const placementCells = new Set(cells);
    const someCellsAreAnchor = cells.some(cell => {
      if (isCellCenter(cell)) return true;
      if (!historyHasPriorTurns) return false;
      return getAdjacentCells(cell).some(adj => isCellOccupied(adj) && !placementCells.has(adj));
    });
    return someCellsAreAnchor ? cells : TurnValidationError.NoCellsUsableAsFirst;
  }
}
