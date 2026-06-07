import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { InventoryTile, PlayfieldPlacement } from '@/domain/value-objects/types.ts';

export default class WordsValidationService {
  static execute(
    placements: ReadonlyArray<PlayfieldPlacement>,
    getTileLetter: (tile: InventoryTile) => string,
    containsAllWords: (words: ReadonlyArray<string>) => boolean,
  ): ReadonlyArray<string> | TurnValidationError {
    const words: Array<string> = [];
    for (let idx = 0; idx < placements.length; idx++) {
      const placement = placements[idx];
      if (placement === undefined) throw new ReferenceError(`expected placement at index ${String(idx)}, got undefined`);
      let word = '';
      for (const { tile } of placement) word += getTileLetter(tile);
      words[idx] = word;
    }
    return containsAllWords(words) ? words : TurnValidationError.WordNotInDictionary;
  }
}
