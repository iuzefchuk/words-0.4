import BonusService from '@/domain/services/BonusService.ts';
import LayoutService from '@/domain/services/LayoutService.ts';
import { BoardAxis, BoardBonus } from '@/domain/value-objects/enums.ts';
import type { BoardType } from '@/domain/value-objects/enums.ts';
import type {
  BoardAnchorCoordinates,
  BoardBonusDistribution,
  BoardCell,
  BoardLink,
  BoardPlacement,
  InventoryTile,
} from '@/domain/value-objects/types.ts';

export default class Board {
  get anchorCells(): ReadonlySet<BoardCell> {
    if (this.tileByCell.size === 0) return new Set([LayoutService.CENTER_CELL]);
    const result = new Set<BoardCell>();
    for (const cell of this.tileByCell.keys()) {
      for (const adjacent of LayoutService.getAdjacentCells(cell)) {
        if (!this.tileByCell.has(adjacent)) result.add(adjacent);
      }
    }
    return result;
  }

  get cells(): ReadonlyArray<BoardCell> {
    return LayoutService.CELLS;
  }

  get cellsPerAxis(): number {
    return LayoutService.CELLS_PER_AXIS;
  }

  private constructor(
    private readonly bonusByCell: BoardBonusDistribution,
    private readonly tileByCell: Map<BoardCell, InventoryTile>,
    private readonly cellByTile: Map<InventoryTile, BoardCell>,
  ) {}

  static clone(source: Board): Board {
    return new Board(source.bonusByCell, new Map(source.tileByCell), new Map(source.cellByTile));
  }

  static create(type: BoardType, randomizerFunction?: () => number): Board {
    const bonusByCell = BonusService.createDistribution(type, randomizerFunction);
    return new Board(bonusByCell, new Map(), new Map());
  }

  buildPlacement(coords: BoardAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>): BoardPlacement {
    if (tiles.length === 0) throw new Error('cannot create placement from empty tiles');
    const axisCells = LayoutService.getAxisCells(coords);
    const tilesToPlace = new Set(tiles);
    let links: Array<BoardLink> = [];
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

  calculateAxis(cells: ReadonlyArray<BoardCell>): BoardAxis | null {
    let normalizedSequence = cells;
    if (cells.length === 1) {
      const [firstCell] = cells;
      if (firstCell === undefined) throw new ReferenceError('expected first cell, got undefined');
      const firstOccupiedAdjacent = LayoutService.getAdjacentCells(firstCell).find(cell => this.isCellOccupied(cell));
      normalizedSequence = firstOccupiedAdjacent === undefined ? [] : [firstOccupiedAdjacent, firstCell];
    }
    if (normalizedSequence.length === 0) return LayoutService.DEFAULT_AXIS;
    const [firstIndex] = normalizedSequence;
    if (firstIndex === undefined) throw new ReferenceError('expected first index, got undefined');
    const firstColumn = LayoutService.getCellPositionInColumn(firstIndex);
    const isVertical = normalizedSequence.every(cell => LayoutService.getCellPositionInColumn(cell) === firstColumn);
    if (isVertical) return BoardAxis.Y;
    const firstRow = LayoutService.getCellPositionInRow(firstIndex);
    const isHorizontal = normalizedSequence.every(cell => LayoutService.getCellPositionInRow(cell) === firstRow);
    if (isHorizontal) return BoardAxis.X;
    return null;
  }

  findCellByTile(tile: InventoryTile): BoardCell | undefined {
    return this.cellByTile.get(tile);
  }

  findTileByCell(cell: BoardCell): InventoryTile | undefined {
    return this.tileByCell.get(cell);
  }

  getAdjacentCells(cell: BoardCell): ReadonlyArray<BoardCell> {
    return LayoutService.getAdjacentCells(cell);
  }

  getAxisCells(coords: BoardAnchorCoordinates): ReadonlyArray<BoardCell> {
    return LayoutService.getAxisCells(coords);
  }

  getBonus(cell: BoardCell): BoardBonus | null {
    return this.bonusByCell.get(cell) ?? null;
  }

  getCellPositionInColumn(cell: BoardCell): number {
    return LayoutService.getCellPositionInColumn(cell);
  }

  getCellPositionInRow(cell: BoardCell): number {
    return LayoutService.getCellPositionInRow(cell);
  }

  getMultiplierForLetter(cell: BoardCell): number {
    const bonus = this.getBonus(cell);
    if (bonus === BoardBonus.DoubleLetter) return 2;
    if (bonus === BoardBonus.TripleLetter) return 3;
    return 1;
  }

  getMultiplierForWord(cell: BoardCell): number {
    const bonus = this.getBonus(cell);
    if (bonus === BoardBonus.DoubleWord) return 2;
    if (bonus === BoardBonus.TripleWord) return 3;
    return 1;
  }

  getOppositeAxis(axis: BoardAxis): BoardAxis {
    return LayoutService.getOppositeAxis(axis);
  }

  isCellCenter(cell: BoardCell): boolean {
    return LayoutService.isCellCenter(cell);
  }

  isCellOccupied(cell: BoardCell): boolean {
    return this.tileByCell.has(cell);
  }

  isCellPositionAtAxisEnd(position: number): boolean {
    return LayoutService.isCellPositionAtAxisEnd(position);
  }

  isCellPositionAtAxisStart(position: number): boolean {
    return LayoutService.isCellPositionAtAxisStart(position);
  }

  isTilePlaced(tile: InventoryTile): boolean {
    return this.cellByTile.has(tile);
  }

  placeTile(cell: BoardCell, tile: InventoryTile): void {
    if (this.tileByCell.has(cell)) throw new Error(`cell ${String(cell)} is already occupied`);
    if (this.cellByTile.has(tile)) throw new Error(`tile ${tile} is already placed on the board`);
    this.tileByCell.set(cell, tile);
    this.cellByTile.set(tile, cell);
  }

  resolvePlacement(tiles: ReadonlyArray<InventoryTile>): BoardPlacement {
    return tiles
      .map(tile => {
        const cell = this.cellByTile.get(tile);
        if (cell === undefined) throw new Error(`tile ${tile} is not placed on the board`);
        return { cell, tile };
      })
      .sort((first, second) => first.cell - second.cell);
  }

  undoPlaceTile(tile: InventoryTile): void {
    const cell = this.cellByTile.get(tile);
    if (cell === undefined) throw new Error(`tile ${tile} is not on the board`);
    this.tileByCell.delete(cell);
    this.cellByTile.delete(tile);
  }
}
