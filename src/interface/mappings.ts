import { GameBonus, GameEvent, GameEventType, GameMatchResult, GamePlayer } from '@/application/types/index.ts';
import { LabeledElement } from '@/interface/enums.ts';
import { Sound } from '@/interface/services/SoundPlayer.ts';

export function getBonusLabel(bonus: GameBonus): LabeledElement {
  return {
    [GameBonus.DoubleLetter]: LabeledElement.LayoutGridItemBonusDoubleLetter,
    [GameBonus.DoubleWord]: LabeledElement.LayoutGridItemBonusDoubleWord,
    [GameBonus.TripleLetter]: LabeledElement.LayoutGridItemBonusTripleLetter,
    [GameBonus.TripleWord]: LabeledElement.LayoutGridItemBonusTripleWord,
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

export function getElementLabel(element: LabeledElement, params?: Record<string, number | string>): string {
  return window.text(
    {
      [LabeledElement.Layout]: 'labels.layout',
      [LabeledElement.LayoutAnnotation]: 'labels.layout_annotation',
      [LabeledElement.LayoutFooterAnnotation]: 'labels.layout_footer_annotation',
      [LabeledElement.LayoutFooterRack]: 'labels.layout_footer_rack',
      [LabeledElement.LayoutFooterRackEmpty]: 'labels.layout_footer_rack_empty',
      [LabeledElement.LayoutFooterRackTile]: 'labels.layout_footer_rack_tile',
      [LabeledElement.LayoutFooterToolbar]: 'labels.layout_footer_toolbar',
      [LabeledElement.LayoutGrid]: 'labels.layout_grid',
      [LabeledElement.LayoutGridItemBonusDoubleLetter]: 'labels.layout_grid_item_bonus_double_letter',
      [LabeledElement.LayoutGridItemBonusDoubleWord]: 'labels.layout_grid_item_bonus_double_word',
      [LabeledElement.LayoutGridItemBonusTripleLetter]: 'labels.layout_grid_item_bonus_triple_letter',
      [LabeledElement.LayoutGridItemBonusTripleWord]: 'labels.layout_grid_item_bonus_triple_word',
      [LabeledElement.LayoutGridItemCellCenter]: 'labels.layout_grid_item_cell_center',
      [LabeledElement.LayoutGridItemCellWithBonus]: 'labels.layout_grid_item_cell_with_bonus',
      [LabeledElement.LayoutGridItemTile]: 'labels.layout_grid_item_tile',
      [LabeledElement.LayoutGridTooltip]: 'labels.layout_grid_tooltip',
      [LabeledElement.LayoutHeaderSetup]: 'labels.layout_header_setup',
      [LabeledElement.LayoutHeaderStats]: 'labels.layout_header_stats',
      [LabeledElement.LayoutRestart]: 'labels.layout_restart',
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
