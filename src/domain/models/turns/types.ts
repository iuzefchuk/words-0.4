import { GamePlayer } from '@/domain/enums.ts';
import { ValidationError, ValidationStatus } from '@/domain/models/turns/enums.ts';
import { GameCell, GamePlacement, GameTile } from '@/domain/types/index.ts';

export type AllComputeds = ComputedCells & ComputedPlacements & ComputedScore & ComputedWords;

export type ComputedCells = { cells: ReadonlyArray<GameCell> };

export type ComputedPlacements = { placements: ReadonlyArray<GamePlacement> };

export type ComputedScore = { score: number };

export type ComputedValue = ComputedCells | ComputedPlacements | ComputedScore | ComputedWords;

export type ComputedWords = { words: ReadonlyArray<string> };

export type InvalidResult = { error: ValidationError; status: ValidationStatus.Invalid };

export type TurnsView = {
  readonly currentPlayer: GamePlayer;
  readonly currentTurnCells: ReadonlyArray<GameCell> | undefined;
  readonly currentTurnIsValid: boolean;
  readonly currentTurnScore: number | undefined;
  readonly currentTurnTiles: ReadonlyArray<GameTile>;
  readonly currentTurnWords: ReadonlyArray<string> | undefined;
  readonly historyHasPriorTurns: boolean;
  readonly nextPlayer: GamePlayer;
  readonly previousTurnTiles: ReadonlyArray<GameTile> | undefined;
};

export type UnvalidatedResult = { status: ValidationStatus.Unvalidated };

export type ValidationResult = InvalidResult | UnvalidatedResult | ValidResult;

export type ValidResult = { status: ValidationStatus.Valid } & AllComputeds;
