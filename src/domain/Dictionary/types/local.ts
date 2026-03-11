import { Letter } from '@/domain/enums.ts';
import { NodeId } from '@/domain/Dictionary/types/shared.ts';

export type FrozenNode = {
  readonly id: NodeId;
  readonly isFinal: boolean;
  readonly children: ReadonlyMap<Letter, FrozenNode>;
};
