import { Difficulty as GameDifficulty, EventType as GameEventType, Letter as GameLetter, Player as GamePlayer } from '@/domain/enums.ts';
import { Bonus as GameBonus, BoardType as GameBonusDistribution } from '@/domain/models/board/enums.ts';
import { default as GameDictionary } from '@/domain/models/dictionary/Dictionary.ts';
import { DictionarySnapshot } from '@/domain/models/dictionary/types.ts';
import { MatchResult as GameMatchResult } from '@/domain/models/match/enums.ts';
import {
  type GeneratorResult as GameGeneratorResult,
  default as GameTurnGenerator,
} from '@/domain/services/turn-generation/TurnGenerationService.ts';
import type { BoardSnapshot, BoardView as GameBoardView, Cell as GameCell } from '@/domain/models/board/types.ts';
import type { InventoryView as GameInventoryView, Tile as GameTile, InventorySnapshot } from '@/domain/models/inventory/types.ts';
import type { MatchView as GameMatchView, MatchSnapshot } from '@/domain/models/match/types.ts';
import type { TurnsView as GameTurnsView, TurnsSnapshot } from '@/domain/models/turns/types.ts';

export type DictionaryRepository = {
  load(): Promise<DictionarySnapshot | null>;
  save(snapshot: DictionarySnapshot): Promise<void>;
};

export type EventsSnapshot = {
  readonly log: Array<GameEvent>;
};

export type GameEvent =
  | { score: number; type: GameEventType.OpponentTurnSaved; words: ReadonlyArray<string> }
  | { score: number; type: GameEventType.UserTurnSaved; words: ReadonlyArray<string> }
  | { type: GameEventType.MatchLost }
  | { type: GameEventType.MatchTied }
  | { type: GameEventType.MatchWon }
  | { type: GameEventType.OpponentTurnPassed }
  | { type: GameEventType.TilePlaced }
  | { type: GameEventType.TileUndoPlaced }
  | { type: GameEventType.UserTurnPassed };

export type GameRepository = {
  delete(): Promise<void>;
  load(): Promise<GameSnapshot | null>;
  save(snapshot: GameSnapshot): Promise<void>;
};

export type GameSettings = {
  boardType: GameBonusDistribution;
  difficulty: GameDifficulty;
};

export type GameSnapshot = {
  board: BoardSnapshot;
  difficulty: GameDifficulty;
  events: EventsSnapshot;
  inventory: InventorySnapshot;
  match: MatchSnapshot;
  turns: TurnsSnapshot;
};

export type IdGenerator = {
  execute(): string;
};

export type { GameBoardView, GameCell, GameGeneratorResult, GameInventoryView, GameMatchView, GameTile, GameTurnsView };
export {
  GameBonus,
  GameBonusDistribution,
  GameDictionary,
  GameDifficulty,
  GameEventType,
  GameLetter,
  GameMatchResult,
  GamePlayer,
  GameTurnGenerator,
};
