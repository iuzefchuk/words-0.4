import { describe, it, expect } from 'vitest';
import ActionTracker, { ActionType } from '@/domain/models/ActionTracker.ts';
import { Player } from '@/domain/enums.ts';

describe('ActionTracker', () => {
  it('returns false for willPlayerPassBeResign when no actions recorded', () => {
    const tracker = new ActionTracker();
    expect(tracker.willPlayerPassBeResign(Player.User)).toBe(false);
    expect(tracker.willPlayerPassBeResign(Player.Opponent)).toBe(false);
  });

  it('records a pass and detects it', () => {
    const tracker = new ActionTracker();
    tracker.record({ type: ActionType.Pass, player: Player.User });
    expect(tracker.willPlayerPassBeResign(Player.User)).toBe(true);
    expect(tracker.willPlayerPassBeResign(Player.Opponent)).toBe(false);
  });

  it('overwrites the last action', () => {
    const tracker = new ActionTracker();
    tracker.record({ type: ActionType.Pass, player: Player.User });
    tracker.record({ type: ActionType.Save, player: Player.User, words: ['TEST'], points: 5 });
    expect(tracker.willPlayerPassBeResign(Player.User)).toBe(false);
  });
});
