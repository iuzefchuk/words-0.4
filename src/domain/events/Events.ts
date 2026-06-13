import { EventType } from '@/domain/events/enums.ts';
import type { GamePlayer } from '@/domain/enums.ts';
import type { Event } from '@/domain/events/types.ts';

export default class Events {
  get logView(): ReadonlyArray<Event> {
    return this.log;
  }

  private constructor(private readonly log: Array<Event>) {}

  static create(initialEvents: Array<Event> = []): Events {
    return new Events([...initialEvents]);
  }

  record(event: Event): void {
    this.log.push(event);
    if (event.type === EventType.TurnSaved) this.compact();
  }

  private compact(): void {
    const compacted: Array<Event> = [];
    const pendingTiles: Array<Event> = [];
    const pendingValidations: Array<Event> = [];

    for (const event of this.log) {
      switch (event.type) {
        case EventType.TilePlaced:
          pendingTiles.push(event);
          break;
        case EventType.TileUndoPlaced: {
          const matchIdx = pendingTiles.findLastIndex(
            e => e.type === EventType.TilePlaced && e.tile === event.tile,
          );
          if (matchIdx !== -1) {
            pendingTiles.splice(matchIdx, 1);
          } else {
            compacted.push(event);
          }
          break;
        }
        case EventType.TurnValidationSet:
          pendingValidations.push(event);
          break;
        case EventType.TurnSaved:
        case EventType.TurnPassed:
          compacted.push(...pendingTiles);
          pendingTiles.length = 0;
          pendingValidations.length = 0;
          compacted.push(event);
          break;
        default:
          compacted.push(...pendingTiles);
          compacted.push(...pendingValidations);
          pendingTiles.length = 0;
          pendingValidations.length = 0;
          compacted.push(event);
          break;
      }
    }
    compacted.push(...pendingTiles);
    compacted.push(...pendingValidations);

    if (compacted.length < this.log.length) {
      this.log.length = 0;
      this.log.push(...compacted);
    }
  }

  reset(initialEvent: Event): void {
    this.log.length = 0;
    this.log.push(initialEvent);
  }

  wasLastTurnEventPassFor(player: GamePlayer): boolean {
    for (let idx = this.log.length - 1; idx >= 0; idx--) {
      const event = this.log[idx];
      if (event === undefined) throw new ReferenceError(`expected event at index ${String(idx)}, got undefined`);
      if (event.type === EventType.TurnPassed && event.player === player) return true;
      if (event.type === EventType.TurnSaved && event.player === player) return false;
    }
    return false;
  }
}
