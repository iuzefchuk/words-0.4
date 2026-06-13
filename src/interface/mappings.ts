import { DomainMatchPlayer, DomainMatchResult, DomainPlayfieldBonus, DomainTimelineEventType } from '@/app/enums/index.ts';
import { Accent } from '@/interface/enums.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';
import type { DomainTimelineEvent } from '@/app/types/index.ts';

export function getBonusAccent(bonus: DomainPlayfieldBonus): Accent {
  return {
    [DomainPlayfieldBonus.DoubleLetter]: Accent.Quaternary,
    [DomainPlayfieldBonus.DoubleWord]: Accent.Secondary,
    [DomainPlayfieldBonus.TripleLetter]: Accent.Tertiary,
    [DomainPlayfieldBonus.TripleWord]: Accent.Primary,
  }[bonus];
}

export function getBonusName(bonus: DomainPlayfieldBonus): string {
  return window.text(
    {
      [DomainPlayfieldBonus.DoubleLetter]: 'general.bonus_dl',
      [DomainPlayfieldBonus.DoubleWord]: 'general.bonus_dw',
      [DomainPlayfieldBonus.TripleLetter]: 'general.bonus_tl',
      [DomainPlayfieldBonus.TripleWord]: 'general.bonus_tw',
    }[bonus],
  );
}

export function getEventSound(event: DomainTimelineEvent): null | Sound {
  switch (event.type) {
    case DomainTimelineEventType.MatchFinished:
      return event.winner === null
        ? Sound.GameLongNeutral
        : event.winner === DomainMatchPlayer.User
          ? Sound.GameLongGood
          : Sound.GameLongBad;
    case DomainTimelineEventType.MatchStarted:
    case DomainTimelineEventType.TurnValidationSet:
      return null;
    case DomainTimelineEventType.TurnPassed:
      return event.player === DomainMatchPlayer.User ? Sound.GameShortBad : Sound.GameShortAltBad;
    case DomainTimelineEventType.TurnSaved:
      return event.player === DomainMatchPlayer.User ? Sound.GameShortGood : Sound.GameShortAltGood;
  }
}

export function getMatchResultText(result: DomainMatchResult, scoreDiff: number): string {
  if (result === DomainMatchResult.Undecided) {
    throw new Error(`cannot render match result text: result is ${DomainMatchResult.Undecided}`);
  }
  return window.text(
    {
      [DomainMatchResult.Lose]: scoreDiff < 0 ? 'general.end_lose_by' : 'general.end_lose',
      [DomainMatchResult.Tie]: 'general.end_tie',
      [DomainMatchResult.Win]: scoreDiff > 0 ? 'general.end_win_by' : 'general.end_win',
    }[result],
    { points: Math.abs(scoreDiff) },
  );
}
