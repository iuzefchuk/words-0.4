import { Letter } from '@/domain/enums.ts';
import DictionaryClass from '@/domain/Dictionary/_index.ts';

declare global {
  type Dictionary = DictionaryClass;
  type Entry = Common.NodeId;
  type NextEntryGenerator = Generator<[Letter, Entry]>;
}

declare namespace Common {
  type NodeId = number;
  type FrozenNode = {
    readonly id: NodeId;
    readonly isFinal: boolean;
    readonly children: ReadonlyMap<Letter, FrozenNode>;
  };
}
