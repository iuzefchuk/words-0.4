import { Player } from '@/domain/enums.js';
import { InitialPlacementGenerator } from '@/domain/Turn/generation/InitialPlacementGenerator.js';

export class TurnGenerator {
  private readonly initialPlacementGenerator: InitialPlacementGenerator;

  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnManager: TurnManager,
  ) {
    this.initialPlacementGenerator = new InitialPlacementGenerator(layout, dictionary, inventory, turnManager);
  }

  *execute(player: Player): Generator<Placement> {
    yield* this.initialPlacementGenerator.execute(player);
  }
}
