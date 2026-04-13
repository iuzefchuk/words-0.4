import { Letter } from '@/domain/enums.ts';

export type NextNodeGenerator = Generator<[Letter, ReadonlyNode]>;

export type Node = { children: Map<Letter, Node>; isFinal: boolean };

export type ReadonlyNode = {
  readonly children: ReadonlyMap<Letter, ReadonlyNode>;
  readonly isFinal: boolean;
};

export type SerializedNode = {
  readonly 0: 0 | 1;
  readonly 1: string;
} & ReadonlyArray<0 | 1 | SerializedNode | string>;

export type Trie = ReadonlyNode;
