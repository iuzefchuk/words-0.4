import type {
  GameCell,
  GameBoardView,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameDictionaryProps,
  GameMatchView,
  GameTurnView,
} from '@/domain/types.ts';
import {
  GameBonus,
  GameEvent,
  GameLetter,
  GamePlayer,
  GameMatchResult,
  GameTurnResolutionType,
  GameDictionary,
} from '@/domain/types.ts';
import { IdGenerator, Clock, Scheduler } from '@/shared/ports.ts';

export type {
  GameCell,
  GameBoardView,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameDictionaryProps,
  GameMatchView,
  GameTurnView,
};
export { GameBonus, GameEvent, GameLetter, GamePlayer, GameMatchResult, GameTurnResolutionType, GameDictionary };

export type AppConfig = {
  boardCells: ReadonlyArray<GameCell>;
  boardCellsPerAxis: number;
};

export type AppState = {
  tilesRemaining: number;
  userTiles: ReadonlyArray<GameTile>;
  userScore: number;
  opponentScore: number;
  currentPlayerIsUser: boolean;
  currentTurnScore?: number;
  currentTurnIsValid: boolean;
  userPassWillBeResign: boolean;
  turnResolutionHistory: ReadonlyArray<AppTurnResolution>;
  matchIsFinished: boolean;
  matchResult?: GameMatchResult;
};

export type AppQueries = {
  areTilesSame: (firstTile: GameTile, secondTile: GameTile) => boolean;
  getTileLetter: (tile: GameTile) => GameLetter;
  isCellCenter: (cell: GameCell) => boolean;
  getCellBonus: (cell: GameCell) => GameBonus | null;
  getCellRowIndex: (cell: GameCell) => number;
  getCellColumnIndex: (cell: GameCell) => number;
  findTileOnCell: (cell: GameCell) => GameTile | undefined;
  findCellWithTile: (tile: GameTile) => GameCell | undefined;
  isTilePlaced: (tile: GameTile) => boolean;
  isCellTopRightInCurrentTurn: (cell: GameCell) => boolean;
  wasTileUsedInPreviousTurn: (tile: GameTile) => boolean;
};

export type AppDependencies = {
  dictionary: GameDictionary;
  idGenerator: IdGenerator;
  clock: Clock;
  scheduler: Scheduler;
};

export type AppTurnResponse = Result<{ words: ReadonlyArray<string> }, string>;

export type AppTurnResolution = { isSave: boolean; isUser: boolean; words?: string; score?: number };
