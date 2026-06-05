import { GameBonus, GameEventType, GameMatchResult, GamePlayer } from '@/app/types/index.ts';
import { Accent } from '@/interface/enums.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';
import type { GameEvent } from '@/app/types/index.ts';

export function getBonusAccent(bonus: GameBonus): Accent {
  return {
    [GameBonus.DoubleLetter]: Accent.Quaternary,
    [GameBonus.DoubleWord]: Accent.Secondary,
    [GameBonus.TripleLetter]: Accent.Tertiary,
    [GameBonus.TripleWord]: Accent.Primary,
  }[bonus];
}

export function getBonusName(bonus: GameBonus): string {
  return window.text(
    {
      [GameBonus.DoubleLetter]: 'general.bonus_dl',
      [GameBonus.DoubleWord]: 'general.bonus_dw',
      [GameBonus.TripleLetter]: 'general.bonus_tl',
      [GameBonus.TripleWord]: 'general.bonus_tw',
    }[bonus],
  );
}

export function getEventSound(event: GameEvent): null | Sound {
  switch (event.type) {
    case GameEventType.MatchDifficultyChanged:
    case GameEventType.MatchStarted:
    case GameEventType.MatchTypeChanged:
    case GameEventType.TurnValidationSet:
      return null;
    case GameEventType.MatchFinished:
      return event.winner === null
        ? Sound.GameLongNeutral
        : event.winner === GamePlayer.User
          ? Sound.GameLongGood
          : Sound.GameLongBad;
    case GameEventType.TilePlaced:
      return Sound.GameShortNeutral;
    case GameEventType.TileUndoPlaced:
      return Sound.GameShortNeutralReverse;
    case GameEventType.TurnPassed:
      return event.player === GamePlayer.User ? Sound.GameShortBad : Sound.GameShortAltBad;
    case GameEventType.TurnSaved:
      return event.player === GamePlayer.User ? Sound.GameShortGood : Sound.GameShortAltGood;
  }
}

export function getMatchResultText(result: GameMatchResult, scoreDiff: number): string {
  if (result === GameMatchResult.Undecided) {
    throw new Error(`cannot render match result text: result is ${GameMatchResult.Undecided}`);
  }
  return window.text(
    {
      [GameMatchResult.Lose]: scoreDiff < 0 ? 'general.end_lose_by' : 'general.end_lose',
      [GameMatchResult.Tie]: 'general.end_tie',
      [GameMatchResult.Win]: scoreDiff > 0 ? 'general.end_win_by' : 'general.end_win',
    }[result],
    { points: Math.abs(scoreDiff) },
  );
}
