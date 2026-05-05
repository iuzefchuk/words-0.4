import { GameBonus, GameEvent, GameEventType, GameMatchResult, GamePlayer } from '@/application/types/index.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';

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
      return getMatchFinishedSound(event.winner);
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
  if (result === GameMatchResult.Undecided) throw new Error('cannot render match result text: result is Undecided');
  return window.text(
    {
      [GameMatchResult.Lose]: scoreDiff < 0 ? 'general.end_lose_by' : 'general.end_lose',
      [GameMatchResult.Tie]: 'general.end_tie',
      [GameMatchResult.Win]: scoreDiff > 0 ? 'general.end_win_by' : 'general.end_win',
    }[result],
    { points: Math.abs(scoreDiff) },
  );
}

function getMatchFinishedSound(winner: GamePlayer | null): Sound {
  if (winner === null) return Sound.GameLongNeutral;
  return winner === GamePlayer.User ? Sound.GameLongGood : Sound.GameLongBad;
}
