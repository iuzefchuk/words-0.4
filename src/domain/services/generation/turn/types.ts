import { Letter } from '@/domain/enums.ts';
import Board from '@/domain/models/board/Board.ts';
import { Axis } from '@/domain/models/board/enums.ts';
import { AnchorCoordinates, Cell, Link } from '@/domain/models/board/types.ts';
import Dictionary from '@/domain/models/dictionary/Dictionary.ts';
import { Node } from '@/domain/models/dictionary/types.ts';
import Inventory from '@/domain/models/inventory/Inventory.ts';
import { Tile, TileCollection } from '@/domain/models/inventory/types.ts';
import Turns from '@/domain/models/turns/Turns.ts';
import { ValidResult } from '@/domain/models/turns/types.ts';
import CrossCheckTable from '@/domain/services/cross-check/CrossCheckTable.ts';
import { GenerationCommandType, GenerationDirection, GenerationTask } from '@/domain/services/generation/turn/enums.ts';

export type ApplyTask = {
  candidate: Candidate;
  resolution: Resolution;
  resolutionComputeds: ResolutionComputeds;
  traversal: Traversal;
  type: GenerationTask.ApplyResolution;
};

export type CalculateTask = { traversal: Traversal; type: GenerationTask.CalculateCandidate };

export type Candidate = { cell: Cell; position: number; resolution: Resolution | undefined };

export type ContinueTaskCommand = { newTasks: Array<Task>; type: GenerationCommandType.ContinueExecute };

export type DispatcherComputeds = { axisCells: ReadonlyArray<Cell>; oppositeAxis: Axis };

export type DispatcherState = { placement: Array<Link>; tiles: MutableTileCollection };

export type EvaluateTask = { traversal: Traversal; type: GenerationTask.EvaluateTraversal };

export type GeneratorArguments = {
  context: GeneratorContext;
  coords: AnchorCoordinates;
  playerTileCollection: TileCollection;
};

export type GeneratorContext = { crossCheckTable: CrossCheckTable; dictionary: Dictionary } & GeneratorContextData;

export type GeneratorContextData = { readonly board: Board; readonly inventory: Inventory; readonly turns: Turns };

export type GeneratorPartition = { length: number; offset: number };

export type GeneratorResult = { cells: ReadonlyArray<Cell>; tiles: ReadonlyArray<Tile>; validationResult: ValidResult };

export type MutableTileCollection = Map<Letter, Array<Tile>>;

export type Resolution = { tile: Tile };

export type ResolutionComputeds = { letterTiles: Array<Tile> };

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

export type Traversal = { direction: GenerationDirection; node: Node; position: number };

export type ValidateTask = { traversal: Traversal; type: GenerationTask.ValidateTraversal };
