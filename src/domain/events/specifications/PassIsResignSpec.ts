import type { GamePlayer } from '@/domain/enums.ts';
import type Events from '@/domain/events/Events.ts';

export default class PassIsResignSpec {
  static isSatisfiedBy(events: Events, player: GamePlayer): boolean {
    return events.wasLastTurnEventPassFor(player);
  }
}
