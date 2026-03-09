import { Axis, Letter } from '@/domain/enums.ts';
import { GenerationDirection, GenerationTask, GenerationTaskResult } from '@/domain/Turnkeeper/enums.ts';
import { Placement } from '@/domain/Turnkeeper/types/shared.ts';
import { Entry } from '@/domain/Dictionary/types/shared.ts';
import { TileCollection, TileId } from '@/domain/Inventory/types/shared.ts';
import { CellIndex } from '@/domain/Layout/types/shared.ts';

export type State = { tiles: TileCollection; placement: Placement };
export type Computeds = { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis };

export type Traversal = { index: number; direction: GenerationDirection; entry: Entry };
export type Candidate = { index: number; cell: CellIndex; connectedTile?: TileId };
export type Resolution = { letter: Letter; tile: TileId };

export type EvaluateTask = { type: GenerationTask.EvaluateTraversal; traversal: Traversal };
export type ValidateTask = { type: GenerationTask.ValidateTraversal; traversal: Traversal };
export type CalculateTask = { type: GenerationTask.CalculateCandidate; traversal: Traversal };
export type ResolveTask = { type: GenerationTask.ResolveCandidate; traversal: Traversal; candidate: Candidate };
export type DoResolveTask = {
  type: GenerationTask.DoResolve;
  traversal: Traversal;
  candidate: Candidate;
  resolution: Resolution;
};
export type UndoResolveTask = { type: GenerationTask.UndoResolve; traversal: Traversal; resolution: Resolution };
export type Task = EvaluateTask | ValidateTask | CalculateTask | ResolveTask | DoResolveTask | UndoResolveTask;

export type ContinueResult = { type: GenerationTaskResult.Continue; tasks: Array<Task> };
export type SuccessResult = { type: GenerationTaskResult.Success; placement: Placement };
export type FailResult = { type: GenerationTaskResult.Fail };
export type TaskResult = ContinueResult | SuccessResult | FailResult;
