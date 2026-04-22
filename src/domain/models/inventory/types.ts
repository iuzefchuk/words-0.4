import { GameLetter, GamePlayer } from '@/domain/enums.ts';

export type InventoryView = {
  areTilesEqual(firstTile: Tile, secondTile: Tile): boolean;
  getTileLetter(tile: Tile): GameLetter;
  getTilesFor(player: GamePlayer): ReadonlyArray<Tile>;
  hasTilesFor(player: GamePlayer): boolean;
  readonly tilesPerPlayer: number;
  readonly unusedTilesCount: number;
};

export type Tile = Brand<string, 'Tile'>;

export type TileCollection = ReadonlyMap<GameLetter, ReadonlyArray<Tile>>;
