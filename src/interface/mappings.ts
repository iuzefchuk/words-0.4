import { GameBonus, GameEventType, GameMatchResult, GamePlayer } from '@/application/types/index.ts';
import { getText } from '@/interface/plugins/LocalesPlugin/LocalesPlugin.ts';
import { Accent } from '@/interface/enums.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';
import type { GameEvent } from '@/application/types/index.ts';

export function getBonusAccent(bonus: GameBonus): Accent {
  return {
    [GameBonus.DoubleLetter]: Accent.Quaternary,
    [GameBonus.DoubleWord]: Accent.Secondary,
    [GameBonus.TripleLetter]: Accent.Tertiary,
    [GameBonus.TripleWord]: Accent.Primary,
  }[bonus];
}

export function getBonusName(bonus: GameBonus): string {
  return getText(
    {
      [GameBonus.DoubleLetter]: 'game.bonus_dl',
      [GameBonus.DoubleWord]: 'game.bonus_dw',
      [GameBonus.TripleLetter]: 'game.bonus_tl',
      [GameBonus.TripleWord]: 'game.bonus_tw',
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
  return getText(
    {
      [GameMatchResult.Lose]: scoreDiff < 0 ? 'end.lose_by' : 'end.lose',
      [GameMatchResult.Tie]: 'end.tie',
      [GameMatchResult.Win]: scoreDiff > 0 ? 'end.win_by' : 'end.win',
    }[result],
    { points: Math.abs(scoreDiff) },
  );
}
