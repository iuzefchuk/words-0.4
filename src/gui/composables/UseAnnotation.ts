import { computed } from 'vue';
import { AppTurnResolution } from '@/application/types.ts';
import MatchStore from '@/gui/stores/MatchStore.ts';

export default class UseAnnotation {
  readonly messages = computed(() => {
    const history = this.getRecentHistory();
    return history.map((resolution, index) => ({
      key: this.getMessageKey(index),
      html: this.createResolutionHtml(resolution),
    }));
  });

  private static readonly MAX_DISPLAYED_MESSAGES = 3;

  private get matchStore() {
    return MatchStore.INSTANCE();
  }

  private getRecentHistory(): ReadonlyArray<AppTurnResolution> {
    const history = this.matchStore.turnResolutionHistory;
    const start = Math.max(0, history.length - UseAnnotation.MAX_DISPLAYED_MESSAGES);
    return history.slice(start);
  }

  private getMessageKey(index: number): number {
    const total = this.matchStore.turnResolutionHistory.length;
    const start = Math.max(0, total - UseAnnotation.MAX_DISPLAYED_MESSAGES);
    return start + index;
  }

  private createResolutionHtml(resolution: AppTurnResolution): string {
    return resolution.isSave ? this.getSaveMessage(resolution) : this.getPassMessage(resolution);
  }

  private getSaveMessage(resolution: AppTurnResolution): string {
    const key = resolution.isUser ? 'game.resolution_save_user' : 'game.resolution_save_opponent';
    return window.t(key, { words: resolution.words!, score: resolution.score! });
  }

  private getPassMessage(resolution: AppTurnResolution): string {
    const key = resolution.isUser ? 'game.resolution_pass_user' : 'game.resolution_pass_opponent';
    return window.t(key);
  }
}
