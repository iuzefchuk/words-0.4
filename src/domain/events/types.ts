import type { TimelineEventType } from '@/domain/events/enums.ts';
import type { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type { InventoryTile, MatchSettings, PlayfieldCell, TurnValidationResult } from '@/domain/value-objects/types.ts';

export type TimelineEvent =
  | { cell: PlayfieldCell; tile: InventoryTile; type: TimelineEventType.TilePlaced }
  | { cell: PlayfieldCell; tile: InventoryTile; type: TimelineEventType.TileUndoPlaced }
  | {
      player: MatchPlayer;
      score: number;
      tiles: ReadonlyArray<InventoryTile>;
      type: TimelineEventType.TurnSaved;
      words: ReadonlyArray<string>;
    }
  | { player: MatchPlayer; type: TimelineEventType.TurnPassed }
  | { seed: number; settings: MatchSettings; type: TimelineEventType.MatchStarted }
  | { type: TimelineEventType.MatchFinished; winner: MatchPlayer | null }
  | { type: TimelineEventType.TurnValidationSet; value: TurnValidationResult };

export type TimelineProjection = {
  readonly eventList: ReadonlyArray<TimelineEvent>;
};
