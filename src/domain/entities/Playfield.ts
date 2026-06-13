import ShuffleService from '@/domain/services/ShuffleService.ts';
import { PlayfieldAxis, PlayfieldBonus, PlayfieldType } from '@/domain/value-objects/enums.ts';
import type {
  IdentifierGateway,
  InventoryTile,
  PlayfieldAnchorCoordinates,
  PlayfieldBonusDistribution,
  PlayfieldCell,
  PlayfieldLinkId,
  TurnLink,
  TurnPlacement,
} from '@/domain/value-objects/types.ts';

type OctantLocation = readonly [row: number, col: number];

class CellService {
  private static readonly CELLS_PER_AXIS = 15;

  private static readonly CELL_COUNT = this.CELLS_PER_AXIS ** 2;

  private static readonly FIRST_CELL_POSITION = 0;

  private static readonly LAST_CELL_POSITION = this.CELLS_PER_AXIS - 1;

  private static readonly ADJACENTS_BY_CELL: ReadonlyMap<PlayfieldCell, ReadonlyArray<PlayfieldCell>> = (() => {
    const cache = new Map<PlayfieldCell, ReadonlyArray<PlayfieldCell>>();
    for (let cell = 0; cell < this.CELL_COUNT; cell++) {
      const col = this.getCellPositionInColumn(cell as PlayfieldCell);
      const row = this.getCellPositionInRow(cell as PlayfieldCell);
      const adjacents: Array<PlayfieldCell> = [];
      if (col > this.FIRST_CELL_POSITION) adjacents.push((cell - 1) as PlayfieldCell);
      if (col < this.LAST_CELL_POSITION) adjacents.push((cell + 1) as PlayfieldCell);
      if (row > this.FIRST_CELL_POSITION) adjacents.push((cell - this.CELLS_PER_AXIS) as PlayfieldCell);
      if (row < this.LAST_CELL_POSITION) adjacents.push((cell + this.CELLS_PER_AXIS) as PlayfieldCell);
      cache.set(cell as PlayfieldCell, adjacents);
    }
    return cache;
  })();

  private static readonly CENTER_CELL = Math.floor(this.CELL_COUNT / 2) as PlayfieldCell;

  static getAdjacentCells(cell: PlayfieldCell): ReadonlyArray<PlayfieldCell> {
    const adjacentCells = this.ADJACENTS_BY_CELL.get(cell);
    if (adjacentCells === undefined) throw new ReferenceError(`expected adjacent cells for cell ${String(cell)}, got undefined`);
    return adjacentCells;
  }

  static getCellPositionInColumn(cell: PlayfieldCell): number {
    return cell % this.CELLS_PER_AXIS;
  }

  static getCellPositionInRow(cell: PlayfieldCell): number {
    return Math.floor(cell / this.CELLS_PER_AXIS);
  }

  static isCellCenter(cell: PlayfieldCell): boolean {
    return cell === this.CENTER_CELL;
  }

  static isCellPositionAtAxisEnd(position: number): boolean {
    return position === this.LAST_CELL_POSITION;
  }

  static isCellPositionAtAxisStart(position: number): boolean {
    return position === this.FIRST_CELL_POSITION;
  }
}

class AxisService {
  static readonly DEFAULT_AXIS = PlayfieldAxis.X;

  private static readonly CELLS_PER_AXIS = 15;

  private static readonly CELLS_BY_AXIS: ReadonlyMap<PlayfieldAxis, ReadonlyArray<ReadonlyArray<PlayfieldCell>>> = (() => {
    const cache = new Map<PlayfieldAxis, ReadonlyArray<ReadonlyArray<PlayfieldCell>>>();
    for (const axis of Object.values(PlayfieldAxis)) {
      const lines: Array<ReadonlyArray<PlayfieldCell>> = [];
      for (let lineIndex = 0; lineIndex < this.CELLS_PER_AXIS; lineIndex++) {
        const cells: Array<PlayfieldCell> = [];
        for (let idx = 0; idx < this.CELLS_PER_AXIS; idx++) {
          cells.push(
            (axis === PlayfieldAxis.X
              ? lineIndex * this.CELLS_PER_AXIS + idx
              : lineIndex + idx * this.CELLS_PER_AXIS) as PlayfieldCell,
          );
        }
        lines.push(cells);
      }
      cache.set(axis, lines);
    }
    return cache;
  })();

  static calculateAxis(
    cells: ReadonlyArray<PlayfieldCell>,
    isCellOccupied: (cell: PlayfieldCell) => boolean,
  ): null | PlayfieldAxis {
    let normalizedSequence = cells;
    if (cells.length === 1) {
      const [firstCell] = cells;
      if (firstCell === undefined) throw new ReferenceError('expected first cell, got undefined');
      const firstOccupiedAdjacent = CellService.getAdjacentCells(firstCell).find(cell => isCellOccupied(cell));
      normalizedSequence = firstOccupiedAdjacent === undefined ? [] : [firstOccupiedAdjacent, firstCell];
    }
    if (normalizedSequence.length === 0) return this.DEFAULT_AXIS;
    const [firstIndex] = normalizedSequence;
    if (firstIndex === undefined) throw new ReferenceError('expected first index, got undefined');
    const firstColumn = CellService.getCellPositionInColumn(firstIndex);
    const isVertical = normalizedSequence.every(cell => CellService.getCellPositionInColumn(cell) === firstColumn);
    if (isVertical) return PlayfieldAxis.Y;
    const firstRow = CellService.getCellPositionInRow(firstIndex);
    const isHorizontal = normalizedSequence.every(cell => CellService.getCellPositionInRow(cell) === firstRow);
    if (isHorizontal) return PlayfieldAxis.X;
    return null;
  }

  static getAxisCells(coords: PlayfieldAnchorCoordinates): ReadonlyArray<PlayfieldCell> {
    const { axis, cell } = coords;
    const cellPosition =
      axis === PlayfieldAxis.X ? CellService.getCellPositionInRow(cell) : CellService.getCellPositionInColumn(cell);
    const axisCells = this.CELLS_BY_AXIS.get(axis);
    if (axisCells === undefined) throw new ReferenceError(`expected axis cells for axis ${axis}, got undefined`);
    const cells = axisCells[cellPosition];
    if (cells === undefined) throw new ReferenceError(`expected axis line at position ${String(cellPosition)}, got undefined`);
    return cells;
  }

  static getOppositeAxis(axis: PlayfieldAxis): PlayfieldAxis {
    return axis === PlayfieldAxis.X ? PlayfieldAxis.Y : PlayfieldAxis.X;
  }
}

class BonusService {
  private static readonly CELLS_PER_AXIS = 15;

  private static readonly CELL_COUNT = this.CELLS_PER_AXIS ** 2;

  private static readonly CENTER_CELL = Math.floor(this.CELL_COUNT / 2) as PlayfieldCell;

  private static readonly ALL_CELLS: ReadonlyArray<PlayfieldCell> = Array.from(
    { length: this.CELL_COUNT },
    (_, idx) => idx as PlayfieldCell,
  );

  private static readonly NON_CENTER_CELLS: ReadonlyArray<PlayfieldCell> = this.ALL_CELLS.filter(
    cell => cell !== this.CENTER_CELL,
  );

  private static readonly PRESET_OCTANT_LOCATIONS_BY_BONUS: ReadonlyMap<PlayfieldBonus, ReadonlyArray<OctantLocation>> = new Map([
    [
      PlayfieldBonus.DoubleLetter,
      [
        [3, 0],
        [6, 2],
        [6, 6],
        [7, 3],
      ],
    ],
    [
      PlayfieldBonus.DoubleWord,
      [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    ],
    [
      PlayfieldBonus.TripleLetter,
      [
        [5, 1],
        [5, 5],
      ],
    ],
    [
      PlayfieldBonus.TripleWord,
      [
        [0, 0],
        [7, 0],
      ],
    ],
  ]);

  private static readonly PRESET_DISTRIBUTION: PlayfieldBonusDistribution = (() => {
    const result = new Map<PlayfieldCell, PlayfieldBonus>();
    for (const [bonus, locations] of this.PRESET_OCTANT_LOCATIONS_BY_BONUS) {
      for (const location of locations) {
        for (const cell of this.getSymmetricCells(location)) result.set(cell, bonus);
      }
    }
    return result;
  })();

  static createDistribution(type: PlayfieldType, randomizerFunction?: () => number): PlayfieldBonusDistribution {
    switch (type) {
      case PlayfieldType.Preset:
        return this.PRESET_DISTRIBUTION;
      case PlayfieldType.Random:
        return this.createRandomDistribution(randomizerFunction);
      default:
        throw new ReferenceError(`unexpected playfield type: ${String(type)}`);
    }
  }

  private static createRandomDistribution(randomizerFunction: () => number = Math.random): PlayfieldBonusDistribution {
    const cells = [...this.NON_CENTER_CELLS];
    ShuffleService.shuffle({ array: cells, randomizerFunction });
    const bonuses = [...this.PRESET_DISTRIBUTION.values()];
    const result = new Map<PlayfieldCell, PlayfieldBonus>();
    for (let idx = 0; idx < bonuses.length; idx++) {
      const cell = cells[idx];
      const bonus = bonuses[idx];
      if (cell === undefined || bonus === undefined) break;
      result.set(cell, bonus);
    }
    return result;
  }

  private static getSymmetricCells([row, col]: OctantLocation): ReadonlySet<PlayfieldCell> {
    const size = this.CELLS_PER_AXIS;
    const last = size - 1;
    const reflections: ReadonlyArray<OctantLocation> = [
      [row, col],
      [row, last - col],
      [last - row, col],
      [last - row, last - col],
      [col, row],
      [col, last - row],
      [last - col, row],
      [last - col, last - row],
    ];
    const cells = new Set<PlayfieldCell>();
    for (const [rowIdx, colIdx] of reflections) cells.add((rowIdx * size + colIdx) as PlayfieldCell);
    return cells;
  }
}

class PlacementService {
  static buildPlacement(
    playfield: Playfield,
    coords: PlayfieldAnchorCoordinates,
    tiles: ReadonlyArray<InventoryTile>,
  ): TurnPlacement {
    if (tiles.length === 0) throw new Error('cannot create placement from empty tiles');
    const axisCells = AxisService.getAxisCells(coords);
    const tilesToPlace = new Set(tiles);
    let links: Array<TurnLink> = [];
    let matchedTilesCount = 0;
    for (const cell of axisCells) {
      const tile = playfield.findTileByCell(cell);
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

  static resolvePlacement(playfield: Playfield, tiles: ReadonlyArray<InventoryTile>): TurnPlacement {
    return tiles
      .map(tile => {
        const cell = playfield.findCellByTile(tile);
        if (cell === undefined) throw new Error(`tile ${tile} is not placed`);
        return { cell, tile };
      })
      .sort((first, second) => first.cell - second.cell);
  }
}

// Octant is an upper-left slice of the playfield depicted on illustration below. The 8 D4 symmetries (4 rotations + 4 reflections) expand it to the full layout:

// [0,0] .     .     .     .     .     .     .     .     .     .     .     .     .     .
// [1,0] [1,1] .     .     .     .     .     .     .     .     .     .     .     .     .
// [2,0] [2,1] [2,2] .     .     .     .     .     .     .     .     .     .     .     .
// [3,0] [3,1] [3,2] [3,3] .     .     .     .     .     .     .     .     .     .     .
// [4,0] [4,1] [4,2] [4,3] [4,4] .     .     .     .     .     .     .     .     .     .
// [5,0] [5,1] [5,2] [5,3] [5,4] [5,5] .     .     .     .     .     .     .     .     .
// [6,0] [6,1] [6,2] [6,3] [6,4] [6,5] [6,6] .     .     .     .     .     .     .     .
// [7,0] [7,1] [7,2] [7,3] [7,4] [7,5] [7,6] *     .     .     .     .     .     .     .   (* = center)

export default class Playfield {
  static readonly CELLS_PER_AXIS = 15;

  static readonly CELLS: ReadonlyArray<PlayfieldCell> = Array.from(
    { length: this.CELLS_PER_AXIS ** 2 },
    (_, idx) => idx as PlayfieldCell,
  );

  static readonly CENTER_CELL = Math.floor(this.CELLS.length / 2) as PlayfieldCell;

  static readonly DEFAULT_AXIS = AxisService.DEFAULT_AXIS;

  get anchorCells(): ReadonlySet<PlayfieldCell> {
    if (this.tileByCell.size === 0) return new Set([Playfield.CENTER_CELL]);
    const result = new Set<PlayfieldCell>();
    for (const cell of this.tileByCell.keys()) {
      for (const adjacent of Playfield.getAdjacentCells(cell)) {
        if (!this.tileByCell.has(adjacent)) result.add(adjacent);
      }
    }
    return result;
  }

  get cells(): ReadonlyArray<PlayfieldCell> {
    return Playfield.CELLS;
  }

  get cellsPerAxis(): number {
    return Playfield.CELLS_PER_AXIS;
  }

  private readonly cellByTile = new Map<InventoryTile, PlayfieldCell>();

  private readonly linkById = new Map<PlayfieldLinkId, { cell: PlayfieldCell; tile: InventoryTile }>();

  private readonly linkIdByCell = new Map<PlayfieldCell, PlayfieldLinkId>();

  private readonly linkIdByTile = new Map<InventoryTile, PlayfieldLinkId>();

  private readonly tileByCell = new Map<PlayfieldCell, InventoryTile>();

  private constructor(
    private readonly bonusByCell: PlayfieldBonusDistribution,
    private readonly identifier: IdentifierGateway | null,
  ) {}

  static calculateAxis(
    cells: ReadonlyArray<PlayfieldCell>,
    isCellOccupied: (cell: PlayfieldCell) => boolean,
  ): null | PlayfieldAxis {
    return AxisService.calculateAxis(cells, isCellOccupied);
  }

  static clone(source: Playfield, identifier: IdentifierGateway | null = null): Playfield {
    const playfield = new Playfield(source.bonusByCell, identifier);
    for (const [cell, tile] of source.tileByCell) playfield.tileByCell.set(cell, tile);
    for (const [tile, cell] of source.cellByTile) playfield.cellByTile.set(tile, cell);
    for (const [id, link] of source.linkById) playfield.linkById.set(id, link);
    for (const [tile, id] of source.linkIdByTile) playfield.linkIdByTile.set(tile, id);
    for (const [cell, id] of source.linkIdByCell) playfield.linkIdByCell.set(cell, id);
    return playfield;
  }

  static create(type: PlayfieldType, identifier: IdentifierGateway, randomizerFunction?: () => number): Playfield {
    const bonusByCell = BonusService.createDistribution(type, randomizerFunction);
    return new Playfield(bonusByCell, identifier);
  }

  static getAdjacentCells(cell: PlayfieldCell): ReadonlyArray<PlayfieldCell> {
    return CellService.getAdjacentCells(cell);
  }

  static getAxisCells(coords: PlayfieldAnchorCoordinates): ReadonlyArray<PlayfieldCell> {
    return AxisService.getAxisCells(coords);
  }

  static getCellPositionInColumn(cell: PlayfieldCell): number {
    return CellService.getCellPositionInColumn(cell);
  }

  static getCellPositionInRow(cell: PlayfieldCell): number {
    return CellService.getCellPositionInRow(cell);
  }

  static getOppositeAxis(axis: PlayfieldAxis): PlayfieldAxis {
    return AxisService.getOppositeAxis(axis);
  }

  static isCellCenter(cell: PlayfieldCell): boolean {
    return CellService.isCellCenter(cell);
  }

  static isCellPositionAtAxisEnd(position: number): boolean {
    return CellService.isCellPositionAtAxisEnd(position);
  }

  static isCellPositionAtAxisStart(position: number): boolean {
    return CellService.isCellPositionAtAxisStart(position);
  }

  buildPlacement(coords: PlayfieldAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>): TurnPlacement {
    return PlacementService.buildPlacement(this, coords, tiles);
  }

  findCellByTile(tile: InventoryTile): PlayfieldCell | undefined {
    return this.cellByTile.get(tile);
  }

  findLinkIdByTile(tile: InventoryTile): PlayfieldLinkId | undefined {
    return this.linkIdByTile.get(tile);
  }

  findTileByCell(cell: PlayfieldCell): InventoryTile | undefined {
    return this.tileByCell.get(cell);
  }

  getBonus(cell: PlayfieldCell): null | PlayfieldBonus {
    return this.bonusByCell.get(cell) ?? null;
  }

  getLinkCell(id: PlayfieldLinkId): PlayfieldCell {
    const link = this.linkById.get(id);
    if (link === undefined) throw new ReferenceError(`expected link for id ${id}, got undefined`);
    return link.cell;
  }

  getLinkTile(id: PlayfieldLinkId): InventoryTile {
    const link = this.linkById.get(id);
    if (link === undefined) throw new ReferenceError(`expected link for id ${id}, got undefined`);
    return link.tile;
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

  isCellOccupied(cell: PlayfieldCell): boolean {
    return this.tileByCell.has(cell);
  }

  isTilePlaced(tile: InventoryTile): boolean {
    return this.cellByTile.has(tile);
  }

  placeTile(cell: PlayfieldCell, tile: InventoryTile): PlayfieldLinkId {
    if (this.tileByCell.has(cell)) throw new Error(`cell ${String(cell)} is already occupied`);
    if (this.cellByTile.has(tile)) throw new Error(`tile ${tile} is already placed`);
    if (this.identifier === null) throw new Error('cannot create link: identifier is null');
    const id = this.identifier.create() as PlayfieldLinkId;
    this.tileByCell.set(cell, tile);
    this.cellByTile.set(tile, cell);
    this.linkById.set(id, { cell, tile });
    this.linkIdByTile.set(tile, id);
    this.linkIdByCell.set(cell, id);
    return id;
  }

  resolvePlacement(tiles: ReadonlyArray<InventoryTile>): TurnPlacement {
    return PlacementService.resolvePlacement(this, tiles);
  }

  undoPlaceTile(tile: InventoryTile): PlayfieldLinkId {
    const cell = this.cellByTile.get(tile);
    if (cell === undefined) throw new Error(`tile ${tile} is not placed`);
    const id = this.linkIdByTile.get(tile);
    if (id === undefined) throw new ReferenceError(`expected link id for tile ${tile}, got undefined`);
    this.tileByCell.delete(cell);
    this.cellByTile.delete(tile);
    this.linkById.delete(id);
    this.linkIdByTile.delete(tile);
    this.linkIdByCell.delete(cell);
    return id;
  }
}
