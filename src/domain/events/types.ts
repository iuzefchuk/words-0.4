import { EventType } from '@/domain/events/enums.ts';
import {
  GameCell,
  GameMatchDifficulty,
  GameMatchSettings,
  GameMatchType,
  GamePlayer,
  GameTile,
  GameValidationResult,
} from '@/domain/types/index.ts';

export type Event =
  | { cell: GameCell; tile: GameTile; type: EventType.TilePlaced }
  | { cell: GameCell; tile: GameTile; type: EventType.TileUndoPlaced }
  | { difficulty: GameMatchDifficulty; type: EventType.MatchDifficultyChanged }
  | { matchType: GameMatchType; seed: number; type: EventType.MatchTypeChanged }
  | { player: GamePlayer; score: number; type: EventType.TurnSaved; words: ReadonlyArray<string> }
  | { player: GamePlayer; type: EventType.TurnPassed }
  | { result: GameValidationResult; type: EventType.TurnValidated }
  | { seed: number; settings: GameMatchSettings; type: EventType.MatchStarted }
  | { type: EventType.MatchFinished; winner: GamePlayer | null };
