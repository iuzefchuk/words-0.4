import { TimelineEventType } from '@/domain/events/enums.ts';
import type { TimelineEvent } from '@/domain/events/types.ts';

type TurnEndEvent =
  | Extract<TimelineEvent, { type: TimelineEventType.TurnPassed }>
  | Extract<TimelineEvent, { type: TimelineEventType.TurnSaved }>;

export default class Timeline {
  private constructor(readonly eventList: Array<TimelineEvent>) {}

  static create(): Timeline {
    return new Timeline([]);
  }

  private static isTurnEndEvent(event: TimelineEvent): event is TurnEndEvent {
    return event.type === TimelineEventType.TurnPassed || event.type === TimelineEventType.TurnSaved;
  }

  record(event: TimelineEvent): void {
    this.validateEvent(event);
    this.eventList.push(event);
  }

  private findLastTurnEndEvent(): TurnEndEvent | undefined {
    for (let idx = this.eventList.length - 1; idx >= 0; idx--) {
      const event = this.eventList[idx];
      if (event !== undefined && Timeline.isTurnEndEvent(event)) {
        return event;
      }
    }
    return undefined;
  }

  private validateEvent(event: TimelineEvent): void {
    const { length } = this.eventList;
    if (length === 0 && event.type !== TimelineEventType.MatchStarted) {
      throw new Error(`first event must be ${TimelineEventType.MatchStarted}, got ${event.type}`);
    }
    if (length > 0 && event.type === TimelineEventType.MatchStarted) {
      throw new Error(`${TimelineEventType.MatchStarted} can only be the first event`);
    }
    if (length > 0) {
      const last = this.eventList.at(-1);
      if (last?.type === TimelineEventType.MatchFinished) {
        throw new Error(`cannot add ${event.type} after ${TimelineEventType.MatchFinished}`);
      }
    }
    if (Timeline.isTurnEndEvent(event)) {
      const lastTurnEnd = this.findLastTurnEndEvent();
      if (lastTurnEnd?.player === event.player) {
        throw new Error(`${event.type} by ${event.player} cannot follow ${lastTurnEnd.type} by same player`);
      }
    }
  }
}
