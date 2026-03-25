import { Player as GamePlayer, Event as GameEvent, Letter as GameLetter } from '@/domain/enums.ts';
import type { default as Game } from '@/domain/index.ts';
import { Bonus as GameBonus } from '@/domain/models/Board.ts';
import type { CellIndex as GameCell } from '@/domain/models/Board.ts';
import { default as GameDictionary } from '@/domain/models/Dictionary.ts';
import type { DictionaryProps as GameDictionaryProps } from '@/domain/models/Dictionary.ts';
import type { TileId as GameTile } from '@/domain/models/Inventory.ts';
import { MatchResult as GameMatchResult } from '@/domain/models/MatchTracker.ts';
import { ResolutionType as GameTurnResolutionType } from '@/domain/models/TurnTracker.ts';
import type { Resolution as GameTurnResolution } from '@/domain/models/TurnTracker.ts';

export type { Game, GameCell, GameDictionaryProps, GameTile, GameTurnResolution };
export {
  GamePlayer,
  GameEvent,
  GameLetter,
  GameBonus,
  GameDictionary,
  GameMatchResult,
  GameTurnResolutionType,
};

export type GameConfig = {
  readonly boardCells: ReadonlyArray<GameCell>;
  readonly boardCellsPerAxis: number;
};

export type GameState = {
  currentPlayer: GamePlayer;
  nextPlayer: GamePlayer;
  currentTurnCells?: ReadonlyArray<GameCell>;
  currentTurnScore?: number;
  currentTurnWords?: ReadonlyArray<string>;
  currentTurnIsValid: boolean;
  currentTurnTiles: ReadonlyArray<GameTile>;
  previousTurnTiles?: ReadonlyArray<GameTile>;
  hasPriorTurns: boolean;
  turnResolutionHistory: ReadonlyArray<GameTurnResolution>;
  unusedTilesCount: number;
  matchIsFinished: boolean;
};
