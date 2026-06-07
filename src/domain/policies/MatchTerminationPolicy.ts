import WinnerDerivationPolicy from '@/domain/policies/WinnerDerivationPolicy.ts';
import type Inventory from '@/domain/entities/Inventory.ts';
import type Match from '@/domain/entities/Match.ts';
import type { MatchPlayer } from '@/domain/value-objects/enums.ts';
import type { MatchTerminationDecision } from '@/domain/value-objects/types.ts';

export default class MatchTerminationPolicy {
  static afterTurnSaved(input: { currentPlayer: MatchPlayer; inventory: Inventory; match: Match }): MatchTerminationDecision {
    if (input.match.isFinished) return { terminate: false };
    if (input.inventory.hasTilesFor(input.currentPlayer)) return { terminate: false };
    return { terminate: true, winner: WinnerDerivationPolicy.byScore(input.match) };
  }
}
