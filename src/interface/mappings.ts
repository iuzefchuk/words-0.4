import { DomainBoardBonus, DomainMatchPlayer, DomainMatchResult, DomainTimelineEventType } from '@/app/enums/index.ts';
import { Accent } from '@/interface/enums.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';
import type { DomainTimelineEvent } from '@/app/types/index.ts';

export function getBonusAccent(bonus: DomainBoardBonus): Accent {
  return {
    [DomainBoardBonus.DoubleLetter]: Accent.Quaternary,
    [DomainBoardBonus.DoubleWord]: Accent.Secondary,
    [DomainBoardBonus.TripleLetter]: Accent.Tertiary,
    [DomainBoardBonus.TripleWord]: Accent.Primary,
  }[bonus];
}

export function getBonusName(bonus: DomainBoardBonus): string {
  return window.text(
    {
      [DomainBoardBonus.DoubleLetter]: 'general.bonus_dl',
      [DomainBoardBonus.DoubleWord]: 'general.bonus_dw',
      [DomainBoardBonus.TripleLetter]: 'general.bonus_tl',
      [DomainBoardBonus.TripleWord]: 'general.bonus_tw',
    }[bonus],
  );
}

export function getEventSound(event: DomainTimelineEvent): null | Sound {
  switch (event.type) {
    case DomainTimelineEventType.MatchDifficultyChanged:
    case DomainTimelineEventType.MatchStarted:
    case DomainTimelineEventType.MatchTypeChanged:
    case DomainTimelineEventType.TurnValidationSet:
      return null;
    case DomainTimelineEventType.MatchFinished:
      return event.winner === null
        ? Sound.GameLongNeutral
        : event.winner === DomainMatchPlayer.User
          ? Sound.GameLongGood
          : Sound.GameLongBad;
    case DomainTimelineEventType.TilePlaced:
      return Sound.GameShortNeutral;
    case DomainTimelineEventType.TileUndoPlaced:
      return Sound.GameShortNeutralReverse;
    case DomainTimelineEventType.TurnPassed:
      return event.player === DomainMatchPlayer.User ? Sound.GameShortBad : Sound.GameShortAltBad;
    case DomainTimelineEventType.TurnSaved:
      return event.player === DomainMatchPlayer.User ? Sound.GameShortGood : Sound.GameShortAltGood;
  }
}

export function getMatchResultText(result: DomainMatchResult, scoreDiff: number): string {
  if (result === DomainMatchResult.Undecided) {
    throw new Error(`cannot render match result text: result is ${String(DomainMatchResult.Undecided)}`);
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
