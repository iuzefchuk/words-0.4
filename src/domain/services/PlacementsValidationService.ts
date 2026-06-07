import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { PlayfieldAxis } from '@/domain/value-objects/enums.ts';
import type {
  InventoryTile,
  PlayfieldAnchorCoordinates,
  PlayfieldCell,
  PlayfieldPlacement,
} from '@/domain/value-objects/types.ts';

export default class PlacementsValidationService {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    cells: ReadonlyArray<PlayfieldCell>,
    calculateAxis: (cells: ReadonlyArray<PlayfieldCell>) => null | PlayfieldAxis,
    buildPlacement: (coords: PlayfieldAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>) => PlayfieldPlacement,
    getOppositeAxis: (axis: PlayfieldAxis) => PlayfieldAxis,
    findTileByCell: (cell: PlayfieldCell) => InventoryTile | undefined,
  ): ReadonlyArray<PlayfieldPlacement> | TurnValidationError {
    const primaryAxis = calculateAxis(cells);
    if (primaryAxis === null) return TurnValidationError.InvalidTilePlacement;
    const cell = cells[0];
    if (cell === undefined) throw new ReferenceError('expected first cell, got undefined');
    const coords = { axis: primaryAxis, cell };
    const primaryPlacement = buildPlacement(coords, tiles);
    const areLinksUsable = (placement: PlayfieldPlacement): boolean => placement.length > 1;
    if (!areLinksUsable(primaryPlacement)) return TurnValidationError.InvalidTilePlacement;
    const result: Array<PlayfieldPlacement> = [primaryPlacement];
    for (const cell of cells) {
      const coords: PlayfieldAnchorCoordinates = { axis: getOppositeAxis(primaryAxis), cell };
      const tile = findTileByCell(cell);
      if (tile === undefined) continue;
      const secondaryPlacement = buildPlacement(coords, [tile]);
      if (areLinksUsable(secondaryPlacement)) result.push(secondaryPlacement);
    }
    return result;
  }
}
