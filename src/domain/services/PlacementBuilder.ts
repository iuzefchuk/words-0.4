import Board, { AnchorCoordinates, Link, Placement } from '@/domain/models/Board.ts';
import { TileId } from '@/domain/models/Inventory.ts';

export default class PlacementBuilder {
  static execute(board: Board, args: { coords: AnchorCoordinates; tiles: ReadonlyArray<TileId> }): Placement {
    const { coords, tiles } = args;
    if (tiles.length === 0) throw new Error('Tile sequence can`t be empty');
    const axisCells = board.getAxisCells(coords);
    const tilesToPlace = new Set(tiles);
    let links: Array<Link> = [];
    let segmentContainsTile = false;
    let matchedTilesCount = 0;
    for (const cell of axisCells) {
      const tile = board.findTileByCell(cell);
      if (!tile) {
        if (links.length === 0) continue;
        if (segmentContainsTile) break;
        links = [];
        segmentContainsTile = false;
        matchedTilesCount = 0;
        continue;
      }
      links.push({ cell, tile });
      if (tilesToPlace.has(tile)) {
        segmentContainsTile = true;
        matchedTilesCount++;
      }
    }
    const isValid = segmentContainsTile && matchedTilesCount === tiles.length;
    return isValid ? links : [];
  }
}
