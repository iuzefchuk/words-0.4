import { Placement } from '@/domain/models/board/types.ts';
import { Tile } from '@/domain/models/inventory/types.ts';
import { ValidationError } from '@/domain/models/turns/enums.ts';

export default class WordsValidationService {
  static execute(
    placements: ReadonlyArray<Placement>,
    getTileLetter: (tile: Tile) => string,
    containsAllWords: (words: ReadonlyArray<string>) => boolean,
  ): ReadonlyArray<string> | ValidationError {
    const words: Array<string> = [];
    for (let i = 0; i < placements.length; i++) {
      const placement = placements[i];
      if (placement === undefined) throw new ReferenceError('Placement must be defined');
      const letters: Array<string> = [];
      for (const { tile } of placement) letters.push(getTileLetter(tile));
      words[i] = letters.join('');
    }
    return containsAllWords(words) ? words : ValidationError.WordNotInDictionary;
  }
}
