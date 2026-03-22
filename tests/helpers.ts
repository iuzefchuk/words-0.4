import { IdGenerator } from '@/shared/ports.ts';
import Domain from '@/domain/index.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import { Player, Letter } from '@/domain/enums.ts';
import { CellIndex } from '@/domain/models/Board.ts';
import { TileId } from '@/domain/models/Inventory.ts';

export function tileId(value: string): TileId {
  return value as TileId;
}

export function cellIndex(value: number): CellIndex {
  return value as CellIndex;
}

// All single + two-letter combos so any tile combination on center row is valid
export const ALL_WORDS: string[] = [];
for (const a of Object.values(Letter)) {
  ALL_WORDS.push(a);
  for (const b of Object.values(Letter)) {
    ALL_WORDS.push(a + b);
  }
}

export class TestIdGenerator implements IdGenerator {
  private counter = 0;

  execute(): string {
    this.counter++;
    return `test-id-${this.counter}`;
  }
}

export function createTestDictionary(words: ReadonlyArray<string>): Dictionary {
  const sorted = [...words].sort();
  return buildDictionary(sorted);
}

type MutableNode = { id: number; isFinal: boolean; children: Map<Letter, MutableNode> };

function buildDictionary(sortedWords: ReadonlyArray<string>): Dictionary {
  let nodeId = 0;
  const rootNode: MutableNode = { id: nodeId++, isFinal: false, children: new Map() };
  const nodeById = new Map<number, MutableNode>();
  const allLetters = new Set<Letter>();

  for (const word of sortedWords) {
    let current = rootNode;
    for (const ch of word) {
      const letter = ch as Letter;
      allLetters.add(letter);
      let child = current.children.get(letter);
      if (!child) {
        child = { id: nodeId++, isFinal: false, children: new Map() };
        current.children.set(letter, child);
      }
      current = child;
    }
    current.isFinal = true;
  }

  function collectNodes(node: MutableNode): void {
    nodeById.set(node.id, node);
    Object.freeze(node.children);
    Object.freeze(node);
    for (const child of node.children.values()) collectNodes(child);
  }
  collectNodes(rootNode);

  const cache = { rootNode: rootNode as any, nodeById: nodeById as any, allLetters };
  const dict = Dictionary.createFromCache(cache);
  if (!dict) throw new Error('Failed to create test dictionary');
  return dict;
}

export function findTileWithLetter(domain: Domain, player: Player, letter: Letter): TileId | undefined {
  const tiles = domain.getTilesFor(player);
  return tiles.find(tile => domain.getTileLetter(tile) === letter);
}

export function placeAndValidate(
  domain: Domain,
  placements: ReadonlyArray<{ cell: CellIndex; tile: TileId }>,
): void {
  for (const { cell, tile } of placements) {
    domain.placeTile({ cell, tile });
  }
  domain.validateCurrentTurn();
}

export function placeFirstTurn(
  domain: Domain,
  player: Player,
): { tiles: TileId[]; cells: CellIndex[] } {
  const playerTiles = domain.getTilesFor(player);
  const tile1 = playerTiles[0];
  const tile2 = playerTiles[1];
  const cell1 = cellIndex(112); // center
  const cell2 = cellIndex(113); // right of center
  placeAndValidate(domain, [
    { cell: cell1, tile: tile1 },
    { cell: cell2, tile: tile2 },
  ]);
  return { tiles: [tile1, tile2], cells: [cell1, cell2] };
}

export function createTestContext(options?: {
  words?: ReadonlyArray<string>;
}): Domain {
  const idGenerator = new TestIdGenerator();
  const dictionary = createTestDictionary(options?.words ?? ['CAT', 'DOG', 'CAR', 'CARD', 'CATS', 'DO', 'AT']);
  return Domain.create({ dictionary, idGenerator });
}
