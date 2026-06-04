import WinnerDerivationPolicy from '@/domain/models/match/policies/WinnerDerivationPolicy.ts';
import type { GamePlayer } from '@/domain/enums.ts';
import type Inventory from '@/domain/models/inventory/Inventory.ts';
import type Match from '@/domain/models/match/Match.ts';

export type TerminationDecision = { terminate: false } | { terminate: true; winner: GamePlayer | null };

export default class MatchTerminationPolicy {
  static afterTurnSaved(input: { currentPlayer: GamePlayer; inventory: Inventory; match: Match }): TerminationDecision {
    if (input.match.isFinished) return { terminate: false };
    if (input.inventory.hasTilesFor(input.currentPlayer)) return { terminate: false };
    return { terminate: true, winner: WinnerDerivationPolicy.byScore(input.match) };
  }
}
