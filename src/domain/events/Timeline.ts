import type { TimelineEvent } from '@/domain/value-objects/types.ts';

export default class Timeline {
  get view(): ReadonlyArray<TimelineEvent> {
    return this.eventList;
  }

  private constructor(private readonly eventList: Array<TimelineEvent>) {}

  static create(initialEvents: Array<TimelineEvent> = []): Timeline {
    return new Timeline([...initialEvents]);
  }

  record(event: TimelineEvent): void {
    this.eventList.push(event);
  }

  reset(initialEvent: TimelineEvent): void {
    this.eventList.length = 0;
    this.eventList.push(initialEvent);
  }
}
