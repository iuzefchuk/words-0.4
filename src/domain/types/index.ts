import { GameLetter, GamePlayer } from '@/domain/enums.ts';
import { EventType } from '@/domain/events/enums.ts';
import { type Event } from '@/domain/events/types.ts';
import { Type as BoardType, Bonus } from '@/domain/models/board/enums.ts';
import { type BoardView, type Cell, type Placement } from '@/domain/models/board/types.ts';
import { default as GameDictionary } from '@/domain/models/dictionary/Dictionary.ts';
import { type Node } from '@/domain/models/dictionary/types.ts';
import { InventoryView, Tile } from '@/domain/models/inventory/types.ts';
import { Difficulty, Type as GameMatchType, Result } from '@/domain/models/match/enums.ts';
import { MatchSettings, MatchView } from '@/domain/models/match/types.ts';
import { TurnsView, ValidationResult } from '@/domain/models/turns/types.ts';
import { default as TurnGenerator } from '@/domain/services/generation/turn/TurnGenerationService.ts';
import { GeneratorContextData, GeneratorPartition, GeneratorResult } from '@/domain/services/generation/turn/types.ts';

export {
  BoardType as GameBoardType,
  Bonus as GameBonus,
  GameDictionary,
  EventType as GameEventType,
  GameLetter,
  Difficulty as GameMatchDifficulty,
  Result as GameMatchResult,
  GameMatchType,
  GamePlayer,
  TurnGenerator as GameTurnGenerator,
};
// TODO move to enums file

export type {
  BoardView as GameBoardView,
  Cell as GameCell,
  Event as GameEvent,
  GeneratorContextData as GameGeneratorContextData,
  GeneratorPartition as GameGeneratorPartition,
  GeneratorResult as GameGeneratorResult,
  InventoryView as GameInventoryView,
  MatchSettings as GameMatchSettings,
  MatchView as GameMatchView,
  Node as GameNode,
  Placement as GamePlacement,
  Tile as GameTile,
  TurnsView as GameTurnsView,
  ValidationResult as GameValidationResult,
};
