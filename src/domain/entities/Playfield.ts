import PlayfieldBonusService from '@/domain/services/PlayfieldBonusService.ts';
import PlayfieldLayoutService from '@/domain/services/PlayfieldLayoutService.ts';
import { PlayfieldAxis, PlayfieldBonus } from '@/domain/value-objects/enums.ts';
import type { PlayfieldType } from '@/domain/value-objects/enums.ts';
import type {
  InventoryTile,
  PlayfieldAnchorCoordinates,
  PlayfieldBonusDistribution,
  PlayfieldCell,
  PlayfieldLink,
  PlayfieldPlacement,
} from '@/domain/value-objects/types.ts';

export default class Playfield {
  get anchorCells(): ReadonlySet<PlayfieldCell> {
    if (this.tileByCell.size === 0) return new Set([PlayfieldLayoutService.CENTER_CELL]);
    const result = new Set<PlayfieldCell>();
    for (const cell of this.tileByCell.keys()) {
      for (const adjacent of PlayfieldLayoutService.getAdjacentCells(cell)) {
        if (!this.tileByCell.has(adjacent)) result.add(adjacent);
      }
    }
    return result;
  }

  get cells(): ReadonlyArray<PlayfieldCell> {
    return PlayfieldLayoutService.CELLS;
  }

  get cellsPerAxis(): number {
    return PlayfieldLayoutService.CELLS_PER_AXIS;
  }

  private constructor(
    private readonly bonusByCell: PlayfieldBonusDistribution,
    private readonly tileByCell: Map<PlayfieldCell, InventoryTile>,
    private readonly cellByTile: Map<InventoryTile, PlayfieldCell>,
  ) {}

  static clone(source: Playfield): Playfield {
    return new Playfield(source.bonusByCell, new Map(source.tileByCell), new Map(source.cellByTile));
  }

  static create(type: PlayfieldType, randomizerFunction?: () => number): Playfield {
    const bonusByCell = PlayfieldBonusService.createDistribution(type, randomizerFunction);
    return new Playfield(bonusByCell, new Map(), new Map());
  }

  buildPlacement(coords: PlayfieldAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>): PlayfieldPlacement {
    if (tiles.length === 0) throw new Error('cannot create placement from empty tiles');
    const axisCells = PlayfieldLayoutService.getAxisCells(coords);
    const tilesToPlace = new Set(tiles);
    let links: Array<PlayfieldLink> = [];
    let matchedTilesCount = 0;
    for (const cell of axisCells) {
      const tile = this.findTileByCell(cell);
      if (tile === undefined) {
        if (links.length === 0) continue;
        if (matchedTilesCount > 0) break;
        links = [];
        continue;
      }
      links.push({ cell, tile });
      if (tilesToPlace.has(tile)) matchedTilesCount++;
    }
    return matchedTilesCount === tiles.length ? links : [];
  }

  calculateAxis(cells: ReadonlyArray<PlayfieldCell>): null | PlayfieldAxis {
    let normalizedSequence = cells;
    if (cells.length === 1) {
      const [firstCell] = cells;
      if (firstCell === undefined) throw new ReferenceError('expected first cell, got undefined');
      const firstOccupiedAdjacent = PlayfieldLayoutService.getAdjacentCells(firstCell).find(cell => this.isCellOccupied(cell));
      normalizedSequence = firstOccupiedAdjacent === undefined ? [] : [firstOccupiedAdjacent, firstCell];
    }
    if (normalizedSequence.length === 0) return PlayfieldLayoutService.DEFAULT_AXIS;
    const [firstIndex] = normalizedSequence;
    if (firstIndex === undefined) throw new ReferenceError('expected first index, got undefined');
    const firstColumn = PlayfieldLayoutService.getCellPositionInColumn(firstIndex);
    const isVertical = normalizedSequence.every(cell => PlayfieldLayoutService.getCellPositionInColumn(cell) === firstColumn);
    if (isVertical) return PlayfieldAxis.Y;
    const firstRow = PlayfieldLayoutService.getCellPositionInRow(firstIndex);
    const isHorizontal = normalizedSequence.every(cell => PlayfieldLayoutService.getCellPositionInRow(cell) === firstRow);
    if (isHorizontal) return PlayfieldAxis.X;
    return null;
  }

  findCellByTile(tile: InventoryTile): PlayfieldCell | undefined {
    return this.cellByTile.get(tile);
  }

  findTileByCell(cell: PlayfieldCell): InventoryTile | undefined {
    return this.tileByCell.get(cell);
  }

  getAdjacentCells(cell: PlayfieldCell): ReadonlyArray<PlayfieldCell> {
    return PlayfieldLayoutService.getAdjacentCells(cell);
  }

  getAxisCells(coords: PlayfieldAnchorCoordinates): ReadonlyArray<PlayfieldCell> {
    return PlayfieldLayoutService.getAxisCells(coords);
  }

  getBonus(cell: PlayfieldCell): null | PlayfieldBonus {
    return this.bonusByCell.get(cell) ?? null;
  }

  getCellPositionInColumn(cell: PlayfieldCell): number {
    return PlayfieldLayoutService.getCellPositionInColumn(cell);
  }

  getCellPositionInRow(cell: PlayfieldCell): number {
    return PlayfieldLayoutService.getCellPositionInRow(cell);
  }

  getMultiplierForLetter(cell: PlayfieldCell): number {
    const bonus = this.getBonus(cell);
    if (bonus === PlayfieldBonus.DoubleLetter) return 2;
    if (bonus === PlayfieldBonus.TripleLetter) return 3;
    return 1;
  }

  getMultiplierForWord(cell: PlayfieldCell): number {
    const bonus = this.getBonus(cell);
    if (bonus === PlayfieldBonus.DoubleWord) return 2;
    if (bonus === PlayfieldBonus.TripleWord) return 3;
    return 1;
  }

  getOppositeAxis(axis: PlayfieldAxis): PlayfieldAxis {
    return PlayfieldLayoutService.getOppositeAxis(axis);
  }

  isCellCenter(cell: PlayfieldCell): boolean {
    return PlayfieldLayoutService.isCellCenter(cell);
  }

  isCellOccupied(cell: PlayfieldCell): boolean {
    return this.tileByCell.has(cell);
  }

  isCellPositionAtAxisEnd(position: number): boolean {
    return PlayfieldLayoutService.isCellPositionAtAxisEnd(position);
  }

  isCellPositionAtAxisStart(position: number): boolean {
    return PlayfieldLayoutService.isCellPositionAtAxisStart(position);
  }

  isTilePlaced(tile: InventoryTile): boolean {
    return this.cellByTile.has(tile);
  }

  placeTile(cell: PlayfieldCell, tile: InventoryTile): void {
    if (this.tileByCell.has(cell)) throw new Error(`cell ${String(cell)} is already occupied`);
    if (this.cellByTile.has(tile)) throw new Error(`tile ${tile} is already placed on the playfield`);
    this.tileByCell.set(cell, tile);
    this.cellByTile.set(tile, cell);
  }

  resolvePlacement(tiles: ReadonlyArray<InventoryTile>): PlayfieldPlacement {
    return tiles
      .map(tile => {
        const cell = this.cellByTile.get(tile);
        if (cell === undefined) throw new Error(`tile ${tile} is not placed on the playfield`);
        return { cell, tile };
      })
      .sort((first, second) => first.cell - second.cell);
  }

  undoPlaceTile(tile: InventoryTile): void {
    const cell = this.cellByTile.get(tile);
    if (cell === undefined) throw new Error(`tile ${tile} is not on the playfield`);
    this.tileByCell.delete(cell);
    this.cellByTile.delete(tile);
  }
}
