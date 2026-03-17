export enum DomainEvent {
  TilePlaced = 'TilePlaced',
  TileUndone = 'TileUndone',
  TurnSaved = 'TurnSaved',
  TurnPassed = 'TurnPassed',
  TilesShuffled = 'TilesShuffled',
  GameResigned = 'GameResigned',
}

export class EventCollector {
  private events: Array<DomainEvent> = [];

  raise(event: DomainEvent): void {
    this.events.push(event);
  }

  drain(): Array<DomainEvent> {
    const copy = [...this.events];
    this.events.length = 0;
    return copy;
  }
}
