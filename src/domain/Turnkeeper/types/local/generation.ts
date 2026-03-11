import { Axis, Letter } from '@/domain/enums.ts';
import { GenerationDirection, GenerationTask, GenerationCommandType } from '@/domain/Turnkeeper/enums.ts';
import { Placement } from '@/domain/Turnkeeper/types/shared.ts';
import { NodeId } from '@/domain/Dictionary/types/shared.ts';
import { TileCollection, TileId } from '@/domain/Inventory/types/shared.ts';
import { AnchorCoordinates, CellIndex } from '@/domain/Layout/types/shared.ts';
import { GameContext } from '@/domain/types.ts';
import { CachedAnchorLettersComputer } from '@/domain/Turnkeeper/types/local/index.ts';

export type Arguments = {
  context: GameContext;
  lettersComputer: CachedAnchorLettersComputer;
  playerTileCollection: TileCollection;
  coords: AnchorCoordinates;
};

export type Traversal = { index: number; direction: GenerationDirection; node: NodeId };
export type Candidate = { index: number; cell: CellIndex; connectedTile?: TileId };
export type Changes = { letter: Letter; tile: TileId };

export type EvaluateTask = { type: GenerationTask.EvaluateTraversal; traversal: Traversal };
export type ValidateTask = { type: GenerationTask.ValidateTraversal; traversal: Traversal };
export type CalculateTask = { type: GenerationTask.CalculateCandidate; traversal: Traversal };
export type ResolveTask = { type: GenerationTask.ResolveCandidate; traversal: Traversal; candidate: Candidate };
export type ApplyChangesTask = {
  type: GenerationTask.ApplyChanges;
  traversal: Traversal;
  candidate: Candidate;
  resolution: Changes;
};
export type ReverseChangesTask = { type: GenerationTask.ReverseChanges; traversal: Traversal; resolution: Changes };
export type Task = EvaluateTask | ValidateTask | CalculateTask | ResolveTask | ApplyChangesTask | ReverseChangesTask;

export type ContinueTaskCommand = { type: GenerationCommandType.ContinueExecute; newTasks: Array<Task> };
export type ReturnTaskCommand = { type: GenerationCommandType.ReturnResult; result: Result };
export type StopTaskCommand = { type: GenerationCommandType.StopExecute };
export type TaskCommand = ContinueTaskCommand | ReturnTaskCommand | StopTaskCommand;

export type DispatcherState = { tiles: TileCollection; placement: Placement };
export type DispatcherComputeds = { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis };

export type Result = Placement;
