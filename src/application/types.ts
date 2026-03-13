import { Board, CellIndex } from '@/domain/board/types.ts';
import { Dictionary } from '@/domain/services/types.ts';
import { TilePool } from '@/domain/tiles/types.ts';
import { TileId } from '@/domain/tiles/types.ts';
import TurnDirector from '@/application/TurnDirector.ts';

export type GameContext = {
  board: Board;
  dictionary: Dictionary;
  tilePool: TilePool;
  turnDirector: TurnDirector;
};

export type GameCell = CellIndex;

export type GameTile = TileId;

export type GameState = {
  isFinished: boolean;
  tilesRemaining: number;
  userTiles: ReadonlyArray<TileId>;
  currentTurnScore?: number;
  userScore: number;
  opponentScore: number;
  currentPlayerIsUser: boolean;
  userPassWillBeResign: boolean;
};
