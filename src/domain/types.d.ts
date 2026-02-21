import { Dictionary } from './Dictionary/Dictionary.ts';
import { Inventory } from './Inventory.ts';
import { Layout } from './Layout/Layout.ts';
import { TurnManager } from './Turn/Turn.ts';

declare global {
  type Dependencies = { layout: Layout; dictionary: Dictionary; inventory: Inventory; turnManager: TurnManager };
}
