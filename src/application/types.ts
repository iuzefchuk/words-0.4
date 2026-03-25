import type {
  GameBoardView,
  GameCell,
  GameDictionaryProps,
  GameGeneratorContext,
  GameGeneratorResult,
  GameInventoryView,
  GameMatchView,
  GameTile,
  GameTurnResolution,
  GameTurnView,
} from '@/domain/types.ts';
import {
  GameBonus,
  GameDictionary,
  GameEvent,
  GameLetter,
  GameMatchResult,
  GamePlayer,
  GameTurnGenerator,
  GameTurnResolutionType,
} from '@/domain/types.ts';
import { Clock, IdGenerator, Scheduler } from '@/shared/ports.ts';

export type {
  GameCell,
  GameBoardView,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameDictionaryProps,
  GameMatchView,
  GameTurnView,
  GameGeneratorContext,
  GameGeneratorResult,
};
export {
  GameBonus,
  GameEvent,
  GameLetter,
  GamePlayer,
  GameMatchResult,
  GameTurnResolutionType,
  GameDictionary,
  GameTurnGenerator,
};

export type AppConfig = {
  boardCells: ReadonlyArray<GameCell>;
  boardCellsPerAxis: number;
};

export type AppQueries = {
  getTilesRemaining: () => number;
  getUserTiles: () => ReadonlyArray<GameTile>;
  getUserScore: () => number;
  getOpponentScore: () => number;
  isCurrentPlayerUser: () => boolean;
  getCurrentTurnScore: () => number | undefined;
  isCurrentTurnValid: () => boolean;
  willUserPassBeResign: () => boolean;
  getTurnResolutionHistory: () => ReadonlyArray<AppTurnResolution>;
  isMatchFinished: () => boolean;
  getMatchResult: () => GameMatchResult | undefined;
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

export type AppCommands = {
  placeTile: (args: { cell: GameCell; tile: GameTile }) => void;
  undoPlaceTile: (tile: GameTile) => void;
  clearTiles: () => void;
  handleSaveTurn: () => { userResponse: AppTurnResponse; opponentTurn?: Promise<AppTurnResponse> };
  handlePassTurn: () => { opponentTurn?: Promise<AppTurnResponse> };
  handleResignMatch: () => void;
  clearAllGameEvents: () => Array<GameEvent>;
};

export type AppDependencies = {
  dictionary: GameDictionary;
  idGenerator: IdGenerator;
  clock: Clock;
  scheduler: Scheduler;
};

export type AppTurnResponse = Result<{ words: ReadonlyArray<string> }, string>;

export type AppTurnResolution = { isSave: boolean; isUser: boolean; words?: string; score?: number };
