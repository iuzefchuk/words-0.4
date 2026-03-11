import { Letter } from '@/domain/enums.ts';
import DictionaryClass from '@/domain/Dictionary/index.ts';

export type Dictionary = DictionaryClass;

export type NodeId = number;

export type NextNodeGenerator = Generator<[Letter, NodeId]>;
