import { TileId } from '@/domain/models/Inventory.ts';

export enum Bonus {
  DoubleWord = 'DoubleWord',
  TripleWord = 'TripleWord',
  DoubleLetter = 'DoubleLetter',
  TripleLetter = 'TripleLetter',
}

export enum Axis {
  X = 'X',
  Y = 'Y',
}

export type CellIndex = number;

export type AnchorCoordinates = { readonly axis: Axis; readonly cell: CellIndex };

const BONUS_CELL_INDEXES: Record<Bonus, ReadonlyArray<CellIndex>> = {
  [Bonus.DoubleLetter]: [
    7, 16, 28, 36, 38, 66, 68, 92, 94, 100, 102, 105, 119, 122, 124, 130, 132, 156, 158, 186, 188, 196, 208, 217,
  ],
  [Bonus.TripleLetter]: [0, 14, 20, 24, 48, 56, 76, 80, 84, 88, 136, 140, 144, 148, 168, 176, 200, 204, 210, 224],
  [Bonus.DoubleWord]: [32, 42, 52, 64, 70, 108, 116, 154, 160, 172, 182, 192],
  [Bonus.TripleWord]: [4, 10, 60, 74, 150, 164, 214, 220],
} as const;

class Layout {
  private static readonly cellsPerAxis = 15;
  private static readonly cellsByIndex: ReadonlyArray<CellIndex> = Array.from(
    { length: Layout.cellsPerAxis ** 2 },
    (_, i) => i,
  );
  private static readonly bonusByCell: ReadonlyMap<CellIndex, Bonus> = new Map(
    Object.values(Bonus).flatMap(bonus => BONUS_CELL_INDEXES[bonus].map(cellIndex => [cellIndex, bonus] as const)),
  );
  private static readonly centerCell: CellIndex = (() => {
    const mid = Math.floor(Layout.cellsPerAxis / 2);
    return mid * Layout.cellsPerAxis + mid;
  })();

  static get cells(): ReadonlyArray<CellIndex> {
    return Layout.cellsByIndex;
  }

  static isCellPositionOnLeftEdge(cellPosition: number): boolean {
    return cellPosition === 0;
  }

  static isCellPositionOnRightEdge(cellPosition: number): boolean {
    return cellPosition === Layout.cellsPerAxis - 1;
  }

  static isCellCenter(cell: CellIndex): boolean {
    Layout.validateCell(cell);
    return cell === Layout.centerCell;
  }

  static getBonusForCell(cell: CellIndex): Bonus | null {
    Layout.validateCell(cell);
    return Layout.bonusByCell.get(cell) ?? null;
  }

  static getLetterMultiplier(cell: CellIndex): number {
    Layout.validateCell(cell);
    const bonus = Layout.getBonusForCell(cell);
    if (bonus === Bonus.DoubleLetter) return 2;
    if (bonus === Bonus.TripleLetter) return 3;
    return 1;
  }

  static getWordMultiplier(cell: CellIndex): number {
    Layout.validateCell(cell);
    const bonus = Layout.getBonusForCell(cell);
    if (bonus === Bonus.DoubleWord) return 2;
    if (bonus === Bonus.TripleWord) return 3;
    return 1;
  }

  static getAdjacentCells(cell: CellIndex): ReadonlyArray<CellIndex> {
    Layout.validateCell(cell);
    const result: Array<CellIndex> = [];
    const row = Layout.getRowIndex(cell);
    const column = Layout.getColumnIndex(cell);
    if (column > 0) result.push(cell - 1);
    if (column < Layout.cellsPerAxis - 1) result.push(cell + 1);
    if (row > 0) result.push(cell - Layout.cellsPerAxis);
    if (row < Layout.cellsPerAxis - 1) result.push(cell + Layout.cellsPerAxis);
    return result;
  }

  static getAxisCells(coords: AnchorCoordinates): ReadonlyArray<CellIndex> {
    const { axis, cell } = coords;
    Layout.validateCell(cell);
    return Array.from({ length: Layout.cellsPerAxis }, (_, i) =>
      axis === Axis.X ? cell - Layout.getColumnIndex(cell) + i : Layout.getColumnIndex(cell) + i * Layout.cellsPerAxis,
    );
  }

  static getRowIndex(cell: CellIndex): number {
    return Math.floor(cell / Layout.cellsPerAxis);
  }

  static getColumnIndex(cell: CellIndex): number {
    return cell % Layout.cellsPerAxis;
  }

  static getOppositeAxis(axis: Axis): Axis {
    return axis === Axis.X ? Axis.Y : Axis.X;
  }

  static validateCell(cell: CellIndex): void {
    if (cell < 0 || cell >= Layout.cellsByIndex.length) throw new Error('Cell out of bounds');
  }
}

export default class Board {
  private static readonly defaultAxis = Axis.X;

  private constructor(
    private readonly tileByCell: Map<CellIndex, TileId>,
    private readonly cellByTile: Map<TileId, CellIndex>,
  ) {}

  static create(): Board {
    return new Board(new Map(), new Map());
  }

  static hydrate(data: unknown): Board {
    return Object.setPrototypeOf(data, Board.prototype);
  }

  get cells(): ReadonlyArray<CellIndex> {
    return Layout.cells;
  }

  isCellCenter(cell: CellIndex): boolean {
    return Layout.isCellCenter(cell);
  }

  getBonusForCell(cell: CellIndex): Bonus | null {
    return Layout.getBonusForCell(cell);
  }

  getLetterMultiplier(cell: CellIndex): number {
    return Layout.getLetterMultiplier(cell);
  }

  getWordMultiplier(cell: CellIndex): number {
    return Layout.getWordMultiplier(cell);
  }

  getAdjacentCells(cell: CellIndex): ReadonlyArray<CellIndex> {
    return Layout.getAdjacentCells(cell);
  }

  getAxisCells(coords: AnchorCoordinates): ReadonlyArray<CellIndex> {
    return Layout.getAxisCells(coords);
  }

  getRowIndex(cell: CellIndex): number {
    return Layout.getRowIndex(cell);
  }

  getColumnIndex(cell: CellIndex): number {
    return Layout.getColumnIndex(cell);
  }

  getOppositeAxis(axis: Axis): Axis {
    return Layout.getOppositeAxis(axis);
  }

  isCellPositionOnLeftEdge(cellPosition: number): boolean {
    return Layout.isCellPositionOnLeftEdge(cellPosition);
  }

  isCellPositionOnRightEdge(cellPosition: number): boolean {
    return Layout.isCellPositionOnRightEdge(cellPosition);
  }

  findTileByCell(cell: CellIndex): TileId | undefined {
    return this.tileByCell.get(cell);
  }

  findCellByTile(tile: TileId): CellIndex | undefined {
    return this.cellByTile.get(tile);
  }

  isCellOccupied(cell: CellIndex): boolean {
    return this.tileByCell.has(cell);
  }

  isTilePlaced(tile: TileId): boolean {
    return this.cellByTile.has(tile);
  }

  placeTile(cell: CellIndex, tile: TileId): void {
    Layout.validateCell(cell);
    if (this.tileByCell.has(cell)) throw new Error(`Cell ${cell} is already occupied`);
    if (this.cellByTile.has(tile)) throw new Error(`Tile ${tile} is already placed on the board`);
    this.tileByCell.set(cell, tile);
    this.cellByTile.set(tile, cell);
  }

  undoPlaceTile(tile: TileId): void {
    const cell = this.cellByTile.get(tile);
    if (cell === undefined) throw new Error(`Tile ${tile} is not on the board`);
    this.tileByCell.delete(cell);
    this.cellByTile.delete(tile);
  }

  getAnchorCells(historyHasOpponentTurns: boolean): ReadonlySet<CellIndex> {
    return new Set(
      Layout.cells.filter((cell: CellIndex) => {
        const isCenter = Layout.isCellCenter(cell);
        if (!historyHasOpponentTurns) return isCenter;
        if (this.isCellOccupied(cell)) return false;
        const hasUsedAdjacentCells = Layout.getAdjacentCells(cell).some((adjacentCell: CellIndex) =>
          this.isCellOccupied(adjacentCell),
        );
        return isCenter || hasUsedAdjacentCells;
      }),
    );
  }

  calculateAxis(cellSequence: ReadonlyArray<CellIndex>): Axis {
    let normalizedSequence = cellSequence;
    if (cellSequence.length === 1) {
      const [firstCell] = cellSequence;
      const connectedAdjacents = this.getAdjacentCells(firstCell).filter(cell => this.isCellOccupied(cell));
      normalizedSequence = connectedAdjacents.length === 0 ? [] : [connectedAdjacents[0], firstCell];
    }
    if (normalizedSequence.length === 0) return Board.defaultAxis;
    const [firstIndex] = normalizedSequence;
    const firstColumn = this.getColumnIndex(firstIndex);
    const isVertical = normalizedSequence.every(cell => this.getColumnIndex(cell) === firstColumn);
    return isVertical ? Axis.Y : Axis.X;
  }
}
