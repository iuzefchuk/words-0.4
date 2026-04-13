export type Node = { children: NodeChildren; isFinal: boolean };

export type NodeChildren = { [key: string]: Node | undefined };

export type ReadonlyNode = {
  readonly children: ReadonlyNodeChildren;
  readonly isFinal: boolean;
};

export type ReadonlyNodeChildren = { readonly [key: string]: ReadonlyNode | undefined };

export type SerializedNode = {
  readonly 0: 0 | 1;
  readonly 1: string;
} & ReadonlyArray<0 | 1 | SerializedNode | string>;

export type Trie = ReadonlyNode;
