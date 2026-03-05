import { Letter } from '@/domain/enums.ts';
import InventoryClass from '@/domain/Inventory/_index.ts';

declare global {
  type Inventory = InventoryClass;
  type TileId = string;
  type TileCollection = Map<Letter, Array<TileId>>;
}
