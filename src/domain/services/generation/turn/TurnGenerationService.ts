import { Player } from '@/domain/enums.ts';
import { Axis } from '@/domain/models/board/enums.ts';
import { AnchorCoordinates } from '@/domain/models/board/types.ts';
import CrossCheckService from '@/domain/services/cross-check/CrossCheckService.ts';
import { GenerationDirection, GenerationTask } from '@/domain/services/generation/turn/enums.ts';
import TaskCommandResolver from '@/domain/services/generation/turn/tasks/command-resolver/CommandResolver.ts';
import TaskDispatcher from '@/domain/services/generation/turn/tasks/dispatcher/Dispatcher.ts';
import { EvaluateTask, GeneratorArguments, GeneratorContext, GeneratorResult } from '@/domain/services/generation/turn/types.ts';

export default class TurnGenerationService {
  static async *execute(context: GeneratorContext, player: Player, yieldControl: () => Promise<void>): AsyncGenerator<GeneratorResult> {
    const { board, dictionary, inventory } = context;
    const playerTileCollection = inventory.getTileCollectionFor(player);
    if (playerTileCollection.size === 0) return;
    const anchorCells = board.calculateAnchorCells();
    if (anchorCells.size === 0) return;
    const crossChecker = new CrossCheckService(board, dictionary, inventory);
    for (const cell of anchorCells) {
      for (const axis of Object.values(Axis)) {
        const coords: AnchorCoordinates = { axis, cell };
        yield* this.generate({ context, coords, crossChecker, playerTileCollection, yieldControl });
      }
    }
  }

  private static async *generate(args: GeneratorArguments): AsyncGenerator<GeneratorResult> {
    const { context, coords, yieldControl } = args;
    const { dictionary } = context;
    const dispatcher = TaskDispatcher.create(args);
    const firstTask: EvaluateTask = {
      traversal: {
        direction: GenerationDirection.Left,
        node: dictionary.rootNode,
        position: dispatcher.computeds.axisCells.indexOf(coords.cell),
      },
      type: GenerationTask.EvaluateTraversal,
    };
    const resolver = TaskCommandResolver.create(firstTask);
    yield* resolver.execute(task => dispatcher.execute(task), yieldControl);
  }
}
