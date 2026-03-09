import { GameContext } from '@/domain/types.ts';
import Dictionary from '@/domain/Dictionary/index.ts';
import Inventory from '@/domain/Inventory/index.ts';
import { TileCollection, TileId } from '@/domain/Inventory/types/shared.ts';
import { Layout, AnchorCoordinates } from '@/domain/Layout/types/shared.ts';
import TurnValidator from '@/domain/Turnkeeper/TurnValidator.ts';
import {
  GenerationDirection,
  GenerationTask,
  GenerationTaskResult,
  ValidationStatus,
} from '@/domain/Turnkeeper/enums.ts';
import {
  State,
  Computeds,
  Traversal,
  Candidate,
  EvaluateTask,
  ValidateTask,
  CalculateTask,
  ResolveTask,
  DoResolveTask,
  UndoResolveTask,
  Task,
  ContinueResult,
  SuccessResult,
  FailResult,
  TaskResult,
} from '@/domain/Turnkeeper/types/local/generation.ts';
import { CachedAnchorLettersComputer } from '@/domain/Turnkeeper/types/local/index.ts';
import { Turnkeeper, Placement } from '@/domain/Turnkeeper/types/shared.ts';

export default class PlacementGenerator {
  constructor(
    private readonly context: GameContext,
    private readonly cachedAnchorLettersComputer: CachedAnchorLettersComputer,
  ) {}

  private get layout(): Layout {
    return this.context.layout;
  }
  private get dictionary(): Dictionary {
    return this.context.dictionary;
  }
  private get inventory(): Inventory {
    return this.context.inventory;
  }
  private get turnkeeper(): Turnkeeper {
    return this.context.turnkeeper;
  }

  *execute({
    playerTileCollection,
    coords,
  }: {
    playerTileCollection: TileCollection;
    coords: AnchorCoordinates;
  }): Generator<Placement> {
    const state: State = { tiles: new Map(playerTileCollection), placement: [] };
    const computeds: Computeds = {
      axisCells: this.layout.getAxisCells(coords),
      oppositeAxis: this.layout.getOppositeAxis(coords.axis),
    };
    const startIndex = computeds.axisCells.indexOf(coords.cellIndex);
    if (startIndex === -1) throw new Error('Start index has to exist');
    const taskStack: Array<Task> = [
      {
        type: GenerationTask.EvaluateTraversal,
        traversal: { index: startIndex, direction: GenerationDirection.Left, entry: this.dictionary.firstEntry },
      },
    ];
    while (taskStack.length > 0) {
      const task = taskStack.pop()!;
      const result = this.perform(task, state, computeds);
      if (result.type === GenerationTaskResult.Success) {
        yield [...result.placement];
        continue;
      }
      if (result.type === GenerationTaskResult.Continue) {
        for (let i = result.tasks.length - 1; i >= 0; i--) taskStack.push(result.tasks[i]);
      }
    }
  }

  private perform(task: Task, state: State, computeds: Computeds): TaskResult {
    switch (task.type) {
      case GenerationTask.EvaluateTraversal:
        return this.evaluateTraversal(task, state);
      case GenerationTask.ValidateTraversal:
        return this.validateTraversal(task);
      case GenerationTask.CalculateCandidate:
        return this.calculateCandidate(task, computeds);
      case GenerationTask.ResolveCandidate:
        return this.resolveCandidate(task, state, computeds);
      case GenerationTask.DoResolve:
        return this.doResolve(task, state);
      case GenerationTask.UndoResolve:
        return this.undoResolve(task, state);
    }
  }

  private static continue(tasks: Array<Task>): ContinueResult {
    return { type: GenerationTaskResult.Continue, tasks };
  }

  private static pass(placement: Placement): SuccessResult {
    return { type: GenerationTaskResult.Success, placement };
  }

  private static fail(): FailResult {
    return { type: GenerationTaskResult.Fail };
  }

  private evaluateTraversal(task: EvaluateTask, state: State): TaskResult {
    const { traversal } = task;
    const placementIsUsable = state.placement.length > 0 && this.dictionary.isEntryPlayable(traversal.entry);
    if (traversal.direction === GenerationDirection.Right && placementIsUsable) {
      const validationResult = new TurnValidator(this.context).execute(state.placement);
      if (validationResult.status === ValidationStatus.Valid) {
        return PlacementGenerator.pass(state.placement);
      }
    }
    const tasks: Array<Task> = [];
    if (traversal.direction === GenerationDirection.Left) {
      tasks.push({
        type: GenerationTask.EvaluateTraversal,
        traversal: { ...traversal, direction: GenerationDirection.Right },
      });
    }
    tasks.push({ ...task, type: GenerationTask.ValidateTraversal });
    return PlacementGenerator.continue(tasks);
  }

  private validateTraversal(task: ValidateTask): TaskResult {
    const { traversal } = task;
    const isEdge =
      traversal.direction === GenerationDirection.Left
        ? this.layout.isCellPositionOnLeftEdge(traversal.index)
        : this.layout.isCellPositionOnRightEdge(traversal.index);
    if (isEdge) return PlacementGenerator.fail();
    return PlacementGenerator.continue([{ ...task, type: GenerationTask.CalculateCandidate }]);
  }

  private calculateCandidate(task: CalculateTask, computeds: Computeds): TaskResult {
    const { traversal } = task;
    const targetIndex = traversal.index + traversal.direction;
    const cell = computeds.axisCells[targetIndex];
    const tile = this.turnkeeper.findTileByCell(cell);
    return PlacementGenerator.continue([
      {
        ...task,
        type: GenerationTask.ResolveCandidate,
        candidate: { index: targetIndex, cell, connectedTile: tile },
      },
    ]);
  }

  private resolveCandidate(task: ResolveTask, state: State, computeds: Computeds): TaskResult {
    const { traversal, candidate } = task;
    if (candidate.connectedTile) return this.followConnectedTile(traversal, candidate, candidate.connectedTile);
    return this.branchOverLetters(traversal, candidate, state, computeds);
  }

  private followConnectedTile(traversal: Traversal, candidate: Candidate, connectedTile: TileId): TaskResult {
    const letter = this.inventory.getTileLetter(connectedTile);
    const nextEntry = this.dictionary.findEntryForWord({ word: letter, startEntry: traversal.entry });
    if (!nextEntry) return PlacementGenerator.fail();
    return PlacementGenerator.continue([
      {
        type: GenerationTask.EvaluateTraversal,
        traversal: { ...traversal, index: candidate.index, entry: nextEntry },
      },
    ]);
  }

  private branchOverLetters(
    traversal: Traversal,
    candidate: Candidate,
    state: State,
    computeds: Computeds,
  ): TaskResult {
    const generator = this.dictionary.createNextEntryGenerator({ startEntry: traversal.entry });
    const anchorLetters = this.cachedAnchorLettersComputer.find({
      axis: computeds.oppositeAxis,
      cellIndex: candidate.cell,
    });
    const branchTasks: Array<Task> = [];
    for (const [possibleNextLetter, entryWithPossibleNextLetter] of generator) {
      const letterTiles = state.tiles.get(possibleNextLetter);
      if (!anchorLetters.has(possibleNextLetter) || !letterTiles || letterTiles.length === 0) {
        continue;
      }
      const tile = letterTiles[letterTiles.length - 1];
      branchTasks.push(
        {
          type: GenerationTask.DoResolve,
          traversal,
          candidate,
          resolution: { letter: possibleNextLetter, tile },
        },
        {
          type: GenerationTask.EvaluateTraversal,
          traversal: { ...traversal, index: candidate.index, entry: entryWithPossibleNextLetter },
        },
        {
          type: GenerationTask.UndoResolve,
          traversal,
          resolution: { letter: possibleNextLetter, tile },
        },
      );
    }
    if (branchTasks.length === 0) return PlacementGenerator.fail();
    return PlacementGenerator.continue(branchTasks);
  }

  private doResolve(task: DoResolveTask, state: State): TaskResult {
    const { candidate, resolution } = task;
    const letterTiles = state.tiles.get(resolution.letter)!;
    const tileIndex = letterTiles.indexOf(resolution.tile);
    if (tileIndex !== -1) letterTiles.splice(tileIndex, 1);
    state.placement.push({ cell: candidate.cell, tile: resolution.tile });
    return PlacementGenerator.continue([]);
  }

  private undoResolve(task: UndoResolveTask, state: State): TaskResult {
    const { letter, tile } = task.resolution;
    state.tiles.get(letter)!.push(tile);
    state.placement.pop();
    return PlacementGenerator.continue([]);
  }
}
