import { Letter } from '@/domain/enums.ts';
import TrieService from '@/domain/models/dictionary/services/trie/TrieService.ts';
import { Node, ReadonlyNode, ReadonlyNodeChildren, SerializedNode, Trie } from '@/domain/models/dictionary/types.ts';

export default class Dictionary {
  get rootNode(): ReadonlyNode {
    return this.trie;
  }

  private constructor(public readonly trie: Trie) {}

  static createFromTrie(trie: Trie): Dictionary {
    return new Dictionary(trie);
  }

  static createNodeTree(array: SerializedNode, yieldControl: () => Promise<void>): Promise<Node> {
    return TrieService.createNodeTree(array, yieldControl);
  }

  containsAllWords(words: ReadonlyArray<string>): boolean {
    if (words.length === 0) throw new Error('Words array is empty');
    return words.every(word => this.containsWord(word));
  }

  getNode(word: string, startNode: ReadonlyNode = this.rootNode): null | ReadonlyNode {
    return this.findNodeForWord(word, startNode);
  }

  getNodeChildren(node: ReadonlyNode): ReadonlyNodeChildren {
    return node.children;
  }

  isNodeFinal(node: ReadonlyNode): boolean {
    return node.isFinal;
  }

  private containsWord(word: string): boolean {
    const node = this.findNodeForWord(word);
    return node?.isFinal || false;
  }

  private findNodeForWord(word: string, startNode: ReadonlyNode = this.rootNode): null | ReadonlyNode {
    let currentNode = startNode;
    for (let i = 0; i < word.length; i++) {
      const letter = word[i] as Letter;
      const nextNode = currentNode.children[letter];
      if (!nextNode) return null;
      currentNode = nextNode;
    }
    return currentNode;
  }
}
