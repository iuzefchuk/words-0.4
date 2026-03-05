import { Letter } from '@/domain/enums.js';
import type { Common as C } from '@/domain/Dictionary/types.d.ts';
import { SORTED_WORDS } from '@/domain/Dictionary/constants.js';
import NodeTreeBuilder from '@/domain/Dictionary/construction/NodeTreeBuilder.js';

export default class Dictionary {
  private constructor(
    private readonly nodeTree: C.FrozenNode,
    public readonly allLetters: ReadonlySet<Letter>,
  ) {}

  private get rootNode(): C.FrozenNode {
    return this.nodeTree;
  }

  get firstEntry(): Entry {
    return this.rootNode.id;
  }

  static create(): Dictionary {
    const nodeTree = NodeTreeBuilder.execute(SORTED_WORDS);
    const allLetters = new Set<Letter>();
    this.populateLetterSetFromNode(allLetters, nodeTree);
    return new Dictionary(nodeTree, allLetters);
  }

  private static populateLetterSetFromNode(set: Set<Letter>, node: C.FrozenNode): void {
    for (const [childLetter, childNode] of node.children) {
      if (!set.has(childLetter)) set.add(childLetter);
      this.populateLetterSetFromNode(set, childNode);
    }
  }

  hasWords(words: ReadonlyArray<string>): boolean {
    return words.every(word => this.hasWord(word));
  }

  hasWord(word: string): boolean {
    const node = this.findNodeForWord(word);
    return node?.isFinal || false;
  }

  findEntryForWord({ word, startEntry = this.firstEntry }: { word: string; startEntry?: Entry }): Entry | null {
    const node = this.findNodeForWord(word, startEntry);
    return node ? node.id : null;
  }

  createNextEntryGenerator({ startEntry }: { startEntry: Entry }): NextEntryGenerator {
    const parentNode = this.findNodeById(startEntry);
    function* generator(node: C.FrozenNode): Generator<[Letter, Entry]> {
      for (const [possibleNextLetter, nodeForPossibleNextLetter] of node.children) {
        yield [possibleNextLetter, nodeForPossibleNextLetter.id] as [Letter, Entry];
      }
    }
    return generator(parentNode);
  }

  isEntryPlayable(entry: Entry): boolean {
    return this.findNodeById(entry).isFinal;
  }

  private findNodeForWord(word: string, parentNodeId: C.NodeId = this.rootNode.id): C.FrozenNode | null {
    let currentNode = this.findNodeById(parentNodeId);
    for (let i = 0; i < word.length; i++) {
      const letter = word[i] as Letter;
      if (!currentNode) return null;
      const nextNode = currentNode.children.get(letter);
      if (!nextNode) return null;
      currentNode = nextNode;
    }
    return currentNode;
  }

  private findNodeById(nodeId: C.NodeId): C.FrozenNode {
    const search = (node: C.FrozenNode): C.FrozenNode => {
      if (node.id === nodeId) return node;
      for (const childNode of node.children.values()) {
        const found = search(childNode);
        if (found) return found;
      }
      throw new Error('Node not found');
    };
    return search(this.rootNode);
  }
}
