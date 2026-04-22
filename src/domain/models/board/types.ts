import { Axis, Bonus } from '@/domain/models/board/enums.ts';
import { GameTile } from '@/domain/types/index.ts';

export type AnchorCoordinates = { readonly axis: Axis; readonly cell: Cell };

export type BoardView = {
  readonly cells: ReadonlyArray<Cell>;
  readonly cellsPerAxis: number;
  findCellByTile(tile: GameTile): Cell | undefined;
  findTileByCell(cell: Cell): GameTile | undefined;
  getAdjacentCells(cell: Cell): ReadonlyArray<Cell>;
  getBonus(cell: Cell): Bonus | null;
  getCellPositionInColumn(cell: Cell): number;
  getCellPositionInRow(cell: Cell): number;
  isCellCenter(cell: Cell): boolean;
  isTilePlaced(tile: GameTile): boolean;
};

export type BonusDistribution = ReadonlyMap<Cell, Bonus>;

export type Cell = Brand<number, 'Cell'>;

export type Link = { readonly cell: Cell; readonly tile: GameTile };

export type Placement = ReadonlyArray<Link>;
