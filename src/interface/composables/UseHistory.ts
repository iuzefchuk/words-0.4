import { computed } from 'vue';
import { DomainMatchPlayer, DomainTimelineEventType } from '@/app/enums/index.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import type { DomainTimelineEvent } from '@/app/types/index.ts';

export default class UseHistory {
  private static readonly MAX_DISPLAYED_EVENTS = 3;

  readonly history = computed(() => {
    return this.displayedEvents.map((event, index) => ({
      html: this.createEventHtml(event),
      key: this.createEventKey(index),
    }));
  });

  private get allDisplayedEvents(): ReadonlyArray<DomainTimelineEvent> {
    return this.mainStore.events.filter(event => this.isEventDisplayed(event));
  }

  private get displayedEvents(): ReadonlyArray<DomainTimelineEvent> {
    const events = this.allDisplayedEvents;
    const start = Math.max(0, events.length - UseHistory.MAX_DISPLAYED_EVENTS);
    return events.slice(start);
  }

  private get mainStore(): ReturnType<typeof MainStore.INSTANCE> {
    return MainStore.INSTANCE();
  }

  private static getPassText(player: DomainMatchPlayer): string {
    return player === DomainMatchPlayer.User
      ? window.text('general.event_pass_user')
      : window.text('general.event_pass_opponent');
  }

  private static getSaveText(player: DomainMatchPlayer, score: number, words: ReadonlyArray<string>): string {
    const joinedWords = words.join(', ');
    return player === DomainMatchPlayer.User
      ? window.text('general.event_save_user', { score, words: joinedWords })
      : window.text('general.event_save_opponent', { score, words: joinedWords });
  }

  private createEventHtml(event: DomainTimelineEvent): string {
    switch (event.type) {
      case DomainTimelineEventType.MatchDifficultyChanged:
      case DomainTimelineEventType.MatchFinished:
      case DomainTimelineEventType.MatchStarted:
      case DomainTimelineEventType.MatchTypeChanged:
      case DomainTimelineEventType.TilePlaced:
      case DomainTimelineEventType.TileUndoPlaced:
      case DomainTimelineEventType.TurnValidationSet:
        return '';
      case DomainTimelineEventType.TurnPassed:
        return UseHistory.getPassText(event.player);
      case DomainTimelineEventType.TurnSaved:
        return UseHistory.getSaveText(event.player, event.score, event.words);
    }
  }

  private createEventKey(index: number): number {
    const total = this.allDisplayedEvents.length;
    const start = Math.max(0, total - UseHistory.MAX_DISPLAYED_EVENTS);
    return start + index;
  }

  private isEventDisplayed(event: DomainTimelineEvent): boolean {
    return event.type === DomainTimelineEventType.TurnPassed || event.type === DomainTimelineEventType.TurnSaved;
  }
}
