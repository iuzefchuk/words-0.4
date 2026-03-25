import { GameBonus, GameLetter, GameMatchResult } from '@/domain/types.ts';
import { BONUS_NAMES, LETTERS_SVG_HTML, MATCH_RESULT_TEXT } from '@/gui/constants.ts';

export function getBonusName(bonus: GameBonus): string {
  return window.t(BONUS_NAMES[bonus] ?? '');
}

export function getMatchResultText(result: GameMatchResult): string {
  return window.t(MATCH_RESULT_TEXT[result] ?? '');
}

export function getLetterSvgHtml(letter: GameLetter): string {
  return LETTERS_SVG_HTML[letter] ?? '';
}
