import DATA from './data.js';

type Node = { id: number; isFinal: boolean; children: Map<string, Node> };

type UnminimizedParentChildCouple = { parentNode: Node; childNodeChar: string; childNode: Node };

type NodeGenerator = Generator<Node, Node>;

export class Dictionary {
  private constructor(public readonly rootNode: Readonly<Node>) {}

  static create(): Dictionary {
    const rootNode = Dictionary.RootNodeFactory.create(DATA);
    return new Dictionary(rootNode);
  }

  hasWords(words: ReadonlyArray<string>): boolean {
    return words.every(word => this.hasWord(word));
  }

  hasWord(word: string): boolean {
    let currentNode = this.rootNode;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const nextNode = currentNode.children.get(char);
      if (!nextNode) return false;
      currentNode = nextNode;
    }
    return currentNode.isFinal;
  }

  static RootNodeFactory = class {
    static create(sortedWords: ReadonlyArray<string>): Readonly<Node> {
      const nodeGenerator = this.nodeGenerator();
      const rootNode = nodeGenerator.next().value;
      const minimizer = new this.NodeMinimizer();
      let previousWord = '';
      for (const word of sortedWords) {
        const differenceStartIndex = this.getWordsCommonPrefixLength(word, previousWord);
        minimizer.minimizeNodes({ downTo: differenceStartIndex });
        const initialParentNode =
          differenceStartIndex === 0 ? rootNode : minimizer.getNodeByIndex(differenceStartIndex);
        for (const unminimizedNode of this.populateNodeFromSubstring(
          nodeGenerator,
          initialParentNode,
          word.substring(differenceStartIndex),
        )) {
          minimizer.addNode(unminimizedNode);
        }
        previousWord = word;
      }
      minimizer.minimizeNodes({ downTo: 0 });
      return rootNode;
    }

    private static *nodeGenerator(): NodeGenerator {
      let id = 0;
      while (true) yield { id: id++, isFinal: false, children: new Map() };
    }

    private static *populateNodeFromSubstring(
      nodeGenerator: NodeGenerator,
      node: Node,
      wordSubstring: string,
    ): Generator<UnminimizedParentChildCouple> {
      let parentNode = node;
      for (let i = 0; i < wordSubstring.length; i++) {
        const childNodeChar = wordSubstring[i];
        const childNode = nodeGenerator.next().value;
        parentNode.children.set(childNodeChar, childNode);
        yield { parentNode, childNodeChar, childNode };
        parentNode = childNode;
      }
      parentNode.isFinal = true;
    }

    private static getWordsCommonPrefixLength(firstWord: string, secondWord: string): number {
      let length = 0;
      const minLength = Math.min(firstWord.length, secondWord.length);
      while (length < minLength && firstWord[length] === secondWord[length]) length++;
      return length;
    }

    static NodeMinimizer = class NodeMinimizer {
      constructor(
        private unminimizedNodes: Array<UnminimizedParentChildCouple> = [],
        private minimizedNodesCache = new Map<string, Node>(),
      ) {}

      getNodeByIndex(index: number): Node {
        return this.unminimizedNodes[index - 1].childNode;
      }

      addNode(node: UnminimizedParentChildCouple): void {
        this.unminimizedNodes.push(node);
      }

      minimizeNodes({ downTo }: { downTo: number }): void {
        for (let i = this.unminimizedNodes.length - 1; i >= downTo; i--) {
          this.minimizeNode(this.unminimizedNodes[i]);
          this.unminimizedNodes.pop();
        }
      }

      private minimizeNode(node: UnminimizedParentChildCouple): void {
        const { childNode, childNodeChar, parentNode } = node;
        const childNodeKey = this.createUniqueKeyForNode(childNode);
        const minimizedChildNode = this.minimizedNodesCache.get(childNodeKey);
        if (minimizedChildNode) {
          parentNode.children.set(childNodeChar, minimizedChildNode);
        } else {
          this.minimizedNodesCache.set(childNodeKey, childNode);
        }
      }

      private createUniqueKeyForNode(node: Node): string {
        let key = node.isFinal ? '1' : '0';
        for (const [char, child] of [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          key += char + child.id;
        }
        return key;
      }
    };
  };
}

// class Node {
//   // TODO ?
// }
