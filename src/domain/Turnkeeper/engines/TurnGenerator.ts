import { Player } from '@/domain/enums.js';
import { InitialPlacementGenerator } from '@/domain/Turnkeeper/generation/InitialPlacementGenerator.js';

export class TurnGenerator {
  private readonly initialPlacementGenerator: InitialPlacementGenerator;

  constructor(layout: Layout, dictionary: Dictionary, inventory: Inventory, turnkeeper: Turnkeeper) {
    this.initialPlacementGenerator = new InitialPlacementGenerator(layout, dictionary, inventory, turnkeeper);
  }

  *execute(player: Player): Generator<Placement> {
    yield* this.initialPlacementGenerator.execute(player);
  }
}
