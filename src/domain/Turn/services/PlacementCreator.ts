import { TileId } from '@/domain/Inventory/Inventory.js';
import { Layout, Coordinates } from '@/domain/Layout/Layout.js';
import { TurnManager, Placement } from '../Turn.js';

export class PlacementCreator {
  constructor(
    private readonly layout: Layout,
    private readonly turnManager: TurnManager,
  ) {}

  execute({ coords, tileSequence }: { coords: Coordinates; tileSequence: ReadonlyArray<TileId> }): Placement {
    if (tileSequence.length === 0) throw new Error('Tile sequence can`t be empty');
    const axisCells = this.layout.getAxisCells(coords);
    const tileSet = new Set(tileSequence);
    const placement: Placement = [];
    let segmentHasTile = false;
    let usedTilesCount = 0;
    for (const cell of axisCells) {
      const tile = this.turnManager.findTileByCell(cell);
      if (!tile) {
        if (placement.length === 0) continue;
        if (segmentHasTile) break;
        placement.length = 0;
        segmentHasTile = false;
        usedTilesCount = 0;
      } else {
        placement.push({ cell, tile });
        if (tileSet.has(tile)) {
          segmentHasTile = true;
          usedTilesCount++;
        }
      }
    }
    const allTilesWereUsed = usedTilesCount === tileSequence.length;
    return segmentHasTile && allTilesWereUsed ? placement : [];
  }
}
