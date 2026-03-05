import { Axis } from '@/domain/enums.ts';
import { Layout as LayoutClass } from '@/domain/Layout/_index.ts';

declare global {
  type Layout = LayoutClass;
  type CellIndex = number;
  type AnchorCoordinates = { readonly axis: Axis; readonly index: CellIndex };
}
