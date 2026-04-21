import { Player } from '@/domain/enums.ts';
import Inventory from '@/domain/models/inventory/Inventory.ts';
import Match from '@/domain/models/match/Match.ts';
import WinnerDerivationPolicy from '@/domain/models/match/policies/WinnerDerivationPolicy.ts';

export type TerminationDecision = { terminate: false } | { terminate: true; winner: null | Player };

export default class MatchTerminationPolicy {
  static afterTurnSaved(input: { currentPlayer: Player; inventory: Inventory; match: Match }): TerminationDecision {
    if (input.match.isFinished) return { terminate: false };
    if (input.inventory.hasTilesFor(input.currentPlayer)) return { terminate: false };
    return { terminate: true, winner: WinnerDerivationPolicy.byScore(input.match) };
  }
}
