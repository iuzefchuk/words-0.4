import { Player } from '@/domain/enums.ts';
import Events from '@/domain/models/events/Events.ts';

export default class PassIsResignSpec {
  static isSatisfiedBy(events: Events, player: Player): boolean {
    return events.wasLastTurnEventPassFor(player);
  }
}
