import { Letter } from '@/domain/enums.ts';
import { Node, SerializedNode } from '@/domain/models/dictionary/types.ts';

export default class TrieService {
  private static readonly YIELD_INTERVAL = 5000;

  static async createNodeTree(array: SerializedNode, yieldControl: () => Promise<void>): Promise<Node> {
    let nodesProcessed = 0;
    const [isFinalFlag, letters] = array;
    const root: Node = { children: new Map(), isFinal: isFinalFlag === 1 };
    type Frame = { array: SerializedNode; index: number; letters: string; node: Node };
    const stack: Array<Frame> = [{ array, index: 0, letters, node: root }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      if (frame.index < frame.letters.length) {
        const childArray = frame.array[frame.index + 2] as SerializedNode;
        const child: Node = { children: new Map(), isFinal: childArray[0] === 1 };
        frame.node.children.set(frame.letters[frame.index] as Letter, child);
        frame.index++;
        stack.push({ array: childArray, index: 0, letters: childArray[1], node: child });
        if (++nodesProcessed % TrieService.YIELD_INTERVAL === 0) await yieldControl();
      } else {
        stack.pop();
      }
    }
    return root;
  }
}
