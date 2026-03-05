import { Letter } from '@/domain/enums.ts';
import { Dictionary as DictionaryClass } from '@/domain/Dictionary/_index.ts';

declare namespace Locals {
  type NodeId = number;

  type FrozenNode = {
    readonly id: NodeId;
    readonly isFinal: boolean;
    readonly children: ReadonlyMap<Letter, FrozenNode>;
  };
}

declare global {
  type Dictionary = DictionaryClass;

  type Entry = Locals.NodeId;

  type NextEntryGenerator = Generator<[Letter, Entry]>;
}
