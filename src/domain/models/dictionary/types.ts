export type Node = Brand<number, 'Node'>;

export type NodeChildren = { readonly [key: string]: Node | undefined };
