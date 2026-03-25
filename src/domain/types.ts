import { Event as GameEvent, Letter as GameLetter, Player as GamePlayer } from '@/domain/enums.ts';
import type { default as Game } from '@/domain/index.ts';
import { Bonus as GameBonus } from '@/domain/models/Board.ts';
import type { BoardView as GameBoardView, CellIndex as GameCell } from '@/domain/models/Board.ts';
import { default as GameDictionary } from '@/domain/models/Dictionary.ts';
import type { DictionaryProps as GameDictionaryProps } from '@/domain/models/Dictionary.ts';
import type { InventoryView as GameInventoryView, TileId as GameTile } from '@/domain/models/Inventory.ts';
import { MatchResult as GameMatchResult } from '@/domain/models/MatchTracker.ts';
import type { MatchView as GameMatchView } from '@/domain/models/MatchTracker.ts';
import { ResolutionType as GameTurnResolutionType } from '@/domain/models/TurnTracker.ts';
import type { Resolution as GameTurnResolution, TurnView as GameTurnView } from '@/domain/models/TurnTracker.ts';
import type {
  GeneratorContext as GameGeneratorContext,
  GeneratorResult as GameGeneratorResult,
} from '@/domain/services/TurnGenerator.ts';
import { default as GameTurnGenerator } from '@/domain/services/TurnGenerator.ts';

export type {
  Game,
  GameCell,
  GameBoardView,
  GameDictionaryProps,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameTurnView,
  GameGeneratorContext,
  GameGeneratorResult,
};
export {
  GamePlayer,
  GameEvent,
  GameLetter,
  GameBonus,
  GameDictionary,
  GameMatchResult,
  GameMatchView,
  GameTurnResolutionType,
  GameTurnGenerator,
};
