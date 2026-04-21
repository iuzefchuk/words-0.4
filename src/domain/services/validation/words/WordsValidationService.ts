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
      if (placement === undefined) throw new ReferenceError(`expected placement at index ${i}, got undefined`);
      let word = '';
      for (const { tile } of placement) word += getTileLetter(tile);
      words[i] = word;
    }
    return containsAllWords(words) ? words : ValidationError.WordNotInDictionary;
  }
}
