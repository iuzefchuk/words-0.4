import Inventory from '@/domain/entities/Inventory.ts';
import Match from '@/domain/entities/Match.ts';
import Playfield from '@/domain/entities/Playfield.ts';
import CrossCheckService from '@/domain/services/CrossCheckService.ts';
import ShuffleService from '@/domain/services/ShuffleService.ts';
import TurnValidationService from '@/domain/services/TurnValidationService.ts';
import CrossCheckTable from '@/domain/value-objects/classes/CrossCheckTable.ts';
import {
  PlayfieldAxis,
  TurnGenerationCommandType,
  TurnGenerationDirection,
  TurnGenerationTask,
  TurnValidationStatus,
} from '@/domain/value-objects/enums.ts';
import type { InventoryLetter, MatchPlayer } from '@/domain/value-objects/enums.ts';
import type {
  DictionaryGraph,
  DictionaryNode,
  InventoryTile,
  InventoryTileCollection,
  PlayfieldAnchorCoordinates,
  PlayfieldCell,
  PlayfieldLink,
  TurnGenerationContext,
  TurnGenerationPartition,
  TurnGenerationResult,
} from '@/domain/value-objects/types.ts';

type ApplyTask = {
  candidate: Candidate;
  resolution: Resolution;
  resolutionComputeds: ResolutionComputeds;
  traversal: Traversal;
  type: TurnGenerationTask.ApplyResolution;
};

type CalculateTask = { traversal: Traversal; type: TurnGenerationTask.CalculateCandidate };

type Candidate = { cell: PlayfieldCell; position: number; resolution: Resolution | undefined };

type ContinueTaskCommand = { newTasks: Array<Task>; type: TurnGenerationCommandType.ContinueExecute };

type DispatcherComputeds = { axisCells: ReadonlyArray<PlayfieldCell>; oppositeAxis: PlayfieldAxis };

type DispatcherState = { placement: Array<PlayfieldLink>; tiles: MutableTileCollection };

type EvaluateTask = { traversal: Traversal; type: TurnGenerationTask.EvaluateTraversal };

type GeneratorArguments = {
  context: TurnGenerationContext;
  coords: PlayfieldAnchorCoordinates;
  playerTileCollection: InventoryTileCollection;
};

type MutableTileCollection = Map<InventoryLetter, Array<InventoryTile>>;

type Resolution = { tile: InventoryTile };

type ResolutionComputeds = { letterTiles: Array<InventoryTile> };

type ResolveTask = { candidate: Candidate; traversal: Traversal; type: TurnGenerationTask.ResolveCandidate };

type ReturnTaskCommand = { result: TurnGenerationResult; type: TurnGenerationCommandType.ReturnResult };

type ReverseTask = {
  resolution: Resolution;
  resolutionComputeds: ResolutionComputeds;
  traversal: Traversal;
  type: TurnGenerationTask.ReverseResolution;
};

type StopTaskCommand = { type: TurnGenerationCommandType.StopExecute };

type Task = ApplyTask | CalculateTask | EvaluateTask | ResolveTask | ReverseTask | ValidateTask;

type TaskCommand = ContinueTaskCommand | ReturnTaskCommand | StopTaskCommand;

type Traversal = { direction: TurnGenerationDirection; node: DictionaryNode; position: number };

type ValidateTask = { traversal: Traversal; type: TurnGenerationTask.ValidateTraversal };

class TaskCommandResolver {
  private constructor(private readonly stack: Array<Task>) {}

  static continueExecute(newTasks: Array<Task>): ContinueTaskCommand {
    return { newTasks, type: TurnGenerationCommandType.ContinueExecute };
  }

  static create(firstTask: Task): TaskCommandResolver {
    const tasks = [firstTask];
    return new TaskCommandResolver(tasks);
  }

  static returnResult(result: TurnGenerationResult): ReturnTaskCommand {
    return { result, type: TurnGenerationCommandType.ReturnResult };
  }

  static stopExecute(): StopTaskCommand {
    return { type: TurnGenerationCommandType.StopExecute };
  }

  *execute(dispatcher: (task: Task) => TaskCommand): Generator<TurnGenerationResult> {
    while (this.stack.length > 0) {
      const task = this.popFromStack();
      const command = dispatcher(task);
      if (command.type === TurnGenerationCommandType.ContinueExecute) this.pushToStack(command.newTasks);
      if (command.type === TurnGenerationCommandType.ReturnResult) yield command.result;
    }
  }

  private popFromStack(): Task {
    const lastTask = this.stack.pop();
    if (lastTask === undefined) throw new ReferenceError('cannot pop task: stack is empty');
    return lastTask;
  }

  private pushToStack(tasks: Array<Task>): void {
    for (let idx = tasks.length - 1; idx >= 0; idx--) {
      const task = tasks[idx];
      if (task === undefined) throw new ReferenceError(`expected task at index ${String(idx)}, got undefined`);
      this.stack.push(task);
    }
  }
}

class TaskDispatcher {
  private get dictionary(): DictionaryGraph {
    return this.context.dictionary;
  }

  private get inventory(): Inventory {
    return this.context.inventory;
  }

  private get placement(): Array<PlayfieldLink> {
    return this.state.placement;
  }

  private get playfield(): Playfield {
    return this.context.playfield;
  }

  private get tiles(): MutableTileCollection {
    return this.state.tiles;
  }

  private constructor(
    private readonly context: TurnGenerationContext,
    private readonly state: DispatcherState,
    public computeds: DispatcherComputeds,
  ) {}

  static create({ context, coords, playerTileCollection }: GeneratorArguments): TaskDispatcher {
    const tiles: MutableTileCollection = new Map();
    for (const [letter, tileIds] of playerTileCollection) tiles.set(letter, [...tileIds]);
    const state: DispatcherState = { placement: [], tiles };
    const computeds: DispatcherComputeds = {
      axisCells: context.playfield.getAxisCells(coords),
      oppositeAxis: context.playfield.getOppositeAxis(coords.axis),
    };
    return new TaskDispatcher(context, state, computeds);
  }

  execute(task: Task): TaskCommand {
    switch (task.type) {
      case TurnGenerationTask.ApplyResolution:
        return this.applyResolution(task);
      case TurnGenerationTask.CalculateCandidate:
        return this.calculateCandidate(task);
      case TurnGenerationTask.EvaluateTraversal:
        return this.evaluateTraversal(task);
      case TurnGenerationTask.ResolveCandidate:
        return this.resolveCandidate(task);
      case TurnGenerationTask.ReverseResolution:
        return this.reverseResolution(task);
      case TurnGenerationTask.ValidateTraversal:
        return this.validateTraversal(task);
    }
  }

  private applyResolution(task: ApplyTask): ContinueTaskCommand {
    const { cell } = task.candidate;
    const { tile } = task.resolution;
    const { letterTiles } = task.resolutionComputeds;
    letterTiles.pop();
    this.placement.push({ cell, tile });
    this.playfield.placeTile(cell, tile);
    return this.emitContinue();
  }

  private calculateAndExploreResolution(traversal: Traversal, candidate: Candidate): ContinueTaskCommand | StopTaskCommand {
    const { cell, position } = candidate;
    const anchorMask = this.context.crossCheckTable.getMask(this.computeds.oppositeAxis, cell);
    const newTasks: Array<Task> = [];
    this.dictionary.forEachNodeChild(traversal.node, (possibleNextLetter, nodeWithPossibleNextLetter, letterIndex) => {
      if (((anchorMask >>> letterIndex) & 1) === 0) return;
      const letterTiles = this.tiles.get(possibleNextLetter);
      if (letterTiles === undefined) return;
      const tile = letterTiles.at(-1);
      if (tile === undefined) return;
      const resolution: Resolution = { tile };
      const resolutionComputeds: ResolutionComputeds = { letterTiles };
      const applyTask: ApplyTask = {
        candidate,
        resolution,
        resolutionComputeds,
        traversal,
        type: TurnGenerationTask.ApplyResolution,
      };
      const evaluateTask: EvaluateTask = {
        traversal: { ...traversal, node: nodeWithPossibleNextLetter, position },
        type: TurnGenerationTask.EvaluateTraversal,
      };
      const reverseTask: ReverseTask = {
        resolution,
        resolutionComputeds,
        traversal,
        type: TurnGenerationTask.ReverseResolution,
      };
      newTasks.push(applyTask, evaluateTask, reverseTask);
    });
    if (newTasks.length === 0) return this.emitStop();
    ShuffleService.shuffle({ array: newTasks, groupSize: 3 });
    return this.emitContinue(newTasks);
  }

  private calculateCandidate(task: CalculateTask): ContinueTaskCommand {
    const { traversal } = task;
    const position = traversal.position + traversal.direction;
    const cell = this.computeds.axisCells[position];
    if (cell === undefined) throw new ReferenceError(`expected cell at position ${String(position)}, got undefined`);
    const tile = this.playfield.findTileByCell(cell);
    const resolution: Resolution | undefined = tile !== undefined ? { tile } : undefined;
    const candidate: Candidate = { cell, position, resolution };
    return this.emitContinue([{ ...task, candidate, type: TurnGenerationTask.ResolveCandidate }]);
  }

  private createTraversalFromCandidate(traversal: Traversal, candidate: Candidate): ContinueTaskCommand | StopTaskCommand {
    const { position, resolution } = candidate;
    if (resolution === undefined) throw new ReferenceError('expected candidate resolution, got undefined');
    const nextNode = this.dictionary.getNode(this.inventory.getTileLetter(resolution.tile), traversal.node);
    if (nextNode === null) return this.emitStop();
    const traversalFromCandidate: Traversal = { ...traversal, node: nextNode, position };
    return this.emitContinue([{ traversal: traversalFromCandidate, type: TurnGenerationTask.EvaluateTraversal }]);
  }

  private emitContinue(newTasks: Array<Task> = []): ContinueTaskCommand {
    return TaskCommandResolver.continueExecute(newTasks);
  }

  private emitReturn(result: TurnGenerationResult): ReturnTaskCommand {
    return TaskCommandResolver.returnResult(result);
  }

  private emitStop(): StopTaskCommand {
    return TaskCommandResolver.stopExecute();
  }

  private evaluateTraversal(task: EvaluateTask): ContinueTaskCommand | ReturnTaskCommand {
    const { traversal } = task;
    const placementIsUsable = this.placement.length > 0 && this.dictionary.isNodeFinal(traversal.node);
    if (traversal.direction === TurnGenerationDirection.Right && placementIsUsable) {
      const tiles: Array<InventoryTile> = [];
      for (const link of this.placement) {
        tiles.push(link.tile);
        this.context.match.addPlacedTile(link.tile);
      }
      const validationResult = TurnValidationService.execute(this.context);
      for (const tile of tiles) this.context.match.removePlacedTile(tile);
      if (validationResult.status === TurnValidationStatus.Valid) {
        const cells = this.placement.map(link => link.cell);
        return this.emitReturn({ cells, tiles, validationResult });
      }
    }
    const nextTasks: Array<Task> = [];
    if (traversal.direction === TurnGenerationDirection.Left) {
      const oppositeDirectionEvaluationTask: EvaluateTask = {
        traversal: { ...traversal, direction: TurnGenerationDirection.Right },
        type: TurnGenerationTask.EvaluateTraversal,
      };
      nextTasks.push(oppositeDirectionEvaluationTask);
    }
    nextTasks.push({ ...task, type: TurnGenerationTask.ValidateTraversal });
    return this.emitContinue(nextTasks);
  }

  private resolveCandidate(task: ResolveTask): ContinueTaskCommand | StopTaskCommand {
    const { candidate, traversal } = task;
    return candidate.resolution !== undefined
      ? this.createTraversalFromCandidate(traversal, candidate)
      : this.calculateAndExploreResolution(traversal, candidate);
  }

  private reverseResolution(task: ReverseTask): ContinueTaskCommand {
    const { tile } = task.resolution;
    const { letterTiles } = task.resolutionComputeds;
    letterTiles.push(tile);
    this.placement.pop();
    this.playfield.undoPlaceTile(tile);
    return this.emitContinue();
  }

  private validateTraversal(task: ValidateTask): ContinueTaskCommand | StopTaskCommand {
    const { traversal } = task;
    const isEdge =
      traversal.direction === TurnGenerationDirection.Left
        ? this.playfield.isCellPositionAtAxisStart(traversal.position)
        : this.playfield.isCellPositionAtAxisEnd(traversal.position);
    if (isEdge) return this.emitStop();
    return this.emitContinue([{ ...task, type: TurnGenerationTask.CalculateCandidate }]);
  }
}

export default class TurnGenerationService {
  static createContext(
    playfield: Playfield,
    dictionary: DictionaryGraph,
    inventory: Inventory,
    match: Match,
  ): TurnGenerationContext {
    const clonedPlayfield = Playfield.clone(playfield);
    return {
      crossCheckTable: CrossCheckService.precompute(clonedPlayfield, dictionary, inventory),
      dictionary,
      inventory,
      match: Match.clone(match),
      playfield: clonedPlayfield,
    };
  }

  static *execute(
    context: TurnGenerationContext,
    player: MatchPlayer,
    partition?: TurnGenerationPartition,
  ): Generator<TurnGenerationResult> {
    const { inventory, playfield } = context;
    const playerTileCollection = inventory.getTileCollectionFor(player);
    if (playerTileCollection.size === 0) return;
    const { anchorCells } = playfield;
    if (anchorCells.size === 0) return;
    const allAnchors = Array.from(anchorCells);
    const anchors =
      partition !== undefined ? allAnchors.slice(partition.offset, partition.offset + partition.length) : allAnchors;
    if (anchors.length === 0) return;
    for (const cell of anchors) {
      for (const axis of Object.values(PlayfieldAxis)) {
        const coords: PlayfieldAnchorCoordinates = { axis, cell };
        yield* this.generate({ context, coords, playerTileCollection });
      }
    }
  }

  static hydrateContext(
    data: unknown,
    dictionary: DictionaryGraph,
    crossCheckBuffer: ArrayBuffer | SharedArrayBuffer,
  ): TurnGenerationContext {
    const source = data as { inventory: Inventory; match: Match; playfield: Playfield };
    const playfield = Playfield.clone(source.playfield);
    return {
      crossCheckTable: CrossCheckTable.createFromBuffer(crossCheckBuffer, playfield.cells.length),
      dictionary,
      inventory: Inventory.clone(source.inventory),
      match: Match.clone(source.match),
      playfield,
    };
  }

  private static *generate(args: GeneratorArguments): Generator<TurnGenerationResult> {
    const { context, coords } = args;
    const { dictionary } = context;
    const dispatcher = TaskDispatcher.create(args);
    const firstTask: EvaluateTask = {
      traversal: {
        direction: TurnGenerationDirection.Left,
        node: dictionary.rootNode,
        position: dispatcher.computeds.axisCells.indexOf(coords.cell),
      },
      type: TurnGenerationTask.EvaluateTraversal,
    };
    const resolver = TaskCommandResolver.create(firstTask);
    yield* resolver.execute(task => dispatcher.execute(task));
  }
}
