import type { Common as C } from '@/domain/Turnkeeper/types.d.ts';
import { InitialPlacementValidator } from '@/domain/Turnkeeper/validation/InitialPlacementValidator.js';

export class TurnValidator {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnkeeper: Turnkeeper,
  ) {}

  execute(initialPlacement: Placement): C.ValidationResult {
    return InitialPlacementValidator.execute(
      initialPlacement,
      this.layout,
      this.dictionary,
      this.inventory,
      this.turnkeeper,
    );
  }
}
