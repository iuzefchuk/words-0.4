import type { GameAxis, GameLetter } from '@/domain/enums.ts';
import type Board from '@/domain/models/board/Board.ts';
import type Dictionary from '@/domain/models/dictionary/Dictionary.ts';
import type Inventory from '@/domain/models/inventory/Inventory.ts';
import type Turns from '@/domain/models/turns/Turns.ts';
import type CrossCheckTable from '@/domain/services/cross-check/CrossCheckTable.ts';
import type { GenerationCommandType, GenerationDirection, GenerationTask } from '@/domain/services/generation/turn/enums.ts';
import type {
  GameAnchorCoordinates,
  GameCell,
  GameLink,
  GameNode,
  GameTile,
  GameTileCollection,
  GameValidResult,
} from '@/domain/types/index.ts';

export type ApplyTask = {
  candidate: Candidate;
  resolution: Resolution;
  resolutionComputeds: ResolutionComputeds;
  traversal: Traversal;
  type: GenerationTask.ApplyResolution;
};

export type CalculateTask = { traversal: Traversal; type: GenerationTask.CalculateCandidate };

export type Candidate = { cell: GameCell; position: number; resolution: Resolution | undefined };

export type ContinueTaskCommand = { newTasks: Array<Task>; type: GenerationCommandType.ContinueExecute };

export type DispatcherComputeds = { axisCells: ReadonlyArray<GameCell>; oppositeAxis: GameAxis };

export type DispatcherState = { placement: Array<GameLink>; tiles: MutableTileCollection };

export type EvaluateTask = { traversal: Traversal; type: GenerationTask.EvaluateTraversal };

export type GeneratorArguments = {
  context: GeneratorContext;
  coords: GameAnchorCoordinates;
  playerTileCollection: GameTileCollection;
};

export type GeneratorContext = { crossCheckTable: CrossCheckTable; dictionary: Dictionary } & GeneratorContextData;

export type GeneratorContextData = { readonly board: Board; readonly inventory: Inventory; readonly turns: Turns };

export type GeneratorPartition = { length: number; offset: number };

export type GeneratorResult = {
  cells: ReadonlyArray<GameCell>;
  tiles: ReadonlyArray<GameTile>;
  validationResult: GameValidResult;
};

export type MutableTileCollection = Map<GameLetter, Array<GameTile>>;

export type Resolution = { tile: GameTile };

export type ResolutionComputeds = { letterTiles: Array<GameTile> };

export type ResolveTask = { candidate: Candidate; traversal: Traversal; type: GenerationTask.ResolveCandidate };

export type ReturnTaskCommand = { result: GeneratorResult; type: GenerationCommandType.ReturnResult };

export type ReverseTask = {
  resolution: Resolution;
  resolutionComputeds: ResolutionComputeds;
  traversal: Traversal;
  type: GenerationTask.ReverseResolution;
};

export type StopTaskCommand = { type: GenerationCommandType.StopExecute };

export type Task = ApplyTask | CalculateTask | EvaluateTask | ResolveTask | ReverseTask | ValidateTask;

export type TaskCommand = ContinueTaskCommand | ReturnTaskCommand | StopTaskCommand;

export type Traversal = { direction: GenerationDirection; node: GameNode; position: number };

export type ValidateTask = { traversal: Traversal; type: GenerationTask.ValidateTraversal };
