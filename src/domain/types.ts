import { Player as GamePlayer, Event as GameEvent, Letter as GameLetter } from '@/domain/enums.ts';
import type { default as Game } from '@/domain/index.ts';
import { Bonus as GameBonus } from '@/domain/models/Board.ts';
import type { CellIndex as GameCell, BoardView as GameBoardView } from '@/domain/models/Board.ts';
import { default as GameDictionary } from '@/domain/models/Dictionary.ts';
import type { DictionaryProps as GameDictionaryProps } from '@/domain/models/Dictionary.ts';
import type { TileId as GameTile, InventoryView as GameInventoryView } from '@/domain/models/Inventory.ts';
import { MatchResult as GameMatchResult } from '@/domain/models/MatchTracker.ts';
import type { MatchView as GameMatchView } from '@/domain/models/MatchTracker.ts';
import { ResolutionType as GameTurnResolutionType } from '@/domain/models/TurnTracker.ts';
import type { Resolution as GameTurnResolution, TurnView as GameTurnView } from '@/domain/models/TurnTracker.ts';

export type {
  Game,
  GameCell,
  GameBoardView,
  GameDictionaryProps,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameTurnView,
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
};
