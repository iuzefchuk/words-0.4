import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { InventoryTile, PlayfieldCell, PlayfieldPlacement } from '@/domain/value-objects/types.ts';

export default class CellsValidationService {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    historyHasPriorTurns: boolean,
    resolvePlacement: (tiles: ReadonlyArray<InventoryTile>) => PlayfieldPlacement,
    isCellCenter: (cell: PlayfieldCell) => boolean,
    getAdjacentCells: (cell: PlayfieldCell) => ReadonlyArray<PlayfieldCell>,
    isCellOccupied: (cell: PlayfieldCell) => boolean,
  ): ReadonlyArray<PlayfieldCell> | TurnValidationError {
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
