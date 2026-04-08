import { Letter } from '@/domain/enums.ts';

export type DictionarySnapshot = {
  readonly allLetters: ReadonlySet<Letter>;
  readonly nodeById: ReadonlyMap<NodeId, FrozenNode>;
  readonly trie: FrozenNode;
};

export type FrozenNode = {
  readonly children: ReadonlyMap<Letter, FrozenNode>;
  readonly id: NodeId;
  readonly isFinal: boolean;
};

export type NextNodeGenerator = Generator<[Letter, NodeId]>;

export type Node = { children: Map<Letter, Node>; id: NodeId; isFinal: boolean };

export type NodeId = number;
