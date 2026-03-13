import { Letter } from '@/domain/tiles/types.ts';
import { LETTER_POINTS } from '@/domain/tiles/constants.ts';
import { TileId } from '@/domain/tiles/types.ts';

export default class Tile {
  private constructor(
    readonly id: TileId,
    readonly letter: Letter,
  ) {}

  static create({ letter }: { letter: Letter }): Tile {
    const id = crypto.randomUUID();
    return new Tile(id, letter);
  }

  get points(): number {
    return LETTER_POINTS[this.letter];
  }

  equals(other: Tile): boolean {
    return this.id === other.id;
  }
}
