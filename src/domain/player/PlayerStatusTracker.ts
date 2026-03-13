import { Player, PlayerAction } from '@/domain/player/types.ts';

export default class PlayerStatusTracker {
  private constructor(private readonly lastActions: Map<Player, PlayerAction>) {}

  static create(players: Array<Player>): PlayerStatusTracker {
    const actions = new Map(players.map(player => [player, PlayerAction.Joined]));
    return new PlayerStatusTracker(actions);
  }

  record(player: Player, action: PlayerAction): void {
    this.lastActions.set(player, action);
  }

  hasPlayerPassed(player: Player): boolean {
    return this.lastActions.get(player) === PlayerAction.Passed;
  }
}
