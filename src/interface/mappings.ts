import { GameBonus, GameEvent, GameEventType, GameMatchResult, GamePlayer } from '@/application/types/index.ts';
import { LabeledElement } from '@/interface/enums.ts';
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

export function getElementLabel(element: LabeledElement, params?: Record<string, number | string>): string {
  return window.text(
    {
      [LabeledElement.Layout]: 'labels.layout_heading',
      [LabeledElement.LayoutField]: 'labels.field',
      [LabeledElement.LayoutFieldScore]: 'labels.field_score',
      [LabeledElement.LayoutFieldSquareBonusDoubleLetter]: 'labels.bonus_dl',
      [LabeledElement.LayoutFieldSquareBonusDoubleWord]: 'labels.bonus_dw',
      [LabeledElement.LayoutFieldSquareBonusTripleLetter]: 'labels.bonus_tl',
      [LabeledElement.LayoutFieldSquareBonusTripleWord]: 'labels.bonus_tw',
      [LabeledElement.LayoutFieldSquareCellCenter]: 'labels.cell_center',
      [LabeledElement.LayoutFieldSquareCellWithBonus]: 'labels.cell_with_bonus',
      [LabeledElement.LayoutFieldSquareTile]: 'labels.tile',
      [LabeledElement.LayoutFooterPool]: 'labels.pool',
      [LabeledElement.LayoutFooterRack]: 'labels.rack',
      [LabeledElement.LayoutFooterRackEmpty]: 'labels.rack_empty',
      [LabeledElement.LayoutFooterRackTile]: 'labels.tile',
      [LabeledElement.LayoutFooterToolbar]: 'labels.toolbar',
      [LabeledElement.LayoutHeaderScore]: 'labels.header_score',
      [LabeledElement.LayoutHeaderSetup]: 'labels.header_setup',
      [LabeledElement.LayoutHistory]: 'labels.layout_history',
      [LabeledElement.LayoutRestart]: 'labels.restart',
      [LabeledElement.Loader]: 'labels.loader',
    }[element],
    params,
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
