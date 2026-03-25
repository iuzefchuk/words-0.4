import type {
  GameCell,
  GameTile,
  GameConfig,
  GameTurnResolution,
  GameDictionaryProps,
} from '@/domain/types.ts';
import {
  GameBonus,
  GameEvent,
  GameLetter,
  GamePlayer,
  GameMatchResult,
  GameDictionary,
} from '@/domain/types.ts';
import { IdGenerator, Clock, Scheduler } from '@/shared/ports.ts';

export type { GameCell, GameTile, GameTurnResolution, GameDictionaryProps };
export { GameBonus, GameEvent, GameLetter, GamePlayer, GameMatchResult, GameDictionary };

export type AppConfig = GameConfig;

export type AppState = {
  tilesRemaining: number;
  matchIsFinished: boolean;
  currentPlayerIsUser: boolean;
  currentTurnScore?: number;
  currentTurnIsValid: boolean;
  userScore: number;
  opponentScore: number;
  userPassWillBeResign: boolean;
  userTiles: ReadonlyArray<GameTile>;
  turnResolutionHistory: ReadonlyArray<AppTurnResolution>;
  matchResult?: GameMatchResult;
};

export type AppDependencies = {
  dictionary: GameDictionary;
  idGenerator: IdGenerator;
  clock: Clock;
  scheduler: Scheduler;
};

export type AppTurnResponse = Result<{ words: ReadonlyArray<string> }, string>;

export type AppTurnResolution = { isSave: boolean; isUser: boolean; words?: string; score?: number };
