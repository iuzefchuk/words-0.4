import { describe, it, expect } from 'vitest';
import PassTurn from '@/application/commands/PassTurn.ts';
import { createTestContext } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';

describe('PassTurn', () => {
  it('advances to next player', () => {
    const domain = createTestContext();
    expect(domain.currentPlayer).toBe(Player.User);

    PassTurn.execute(domain);
    expect(domain.currentPlayer).toBe(Player.Opponent);
  });

  it('records the pass', () => {
    const domain = createTestContext();
    PassTurn.execute(domain);
    expect(domain.willPlayerPassBeResign(Player.User)).toBe(true);
  });

  it('allows consecutive passes by different players', () => {
    const domain = createTestContext();
    PassTurn.execute(domain); // User passes
    PassTurn.execute(domain); // Opponent passes
    expect(domain.currentPlayer).toBe(Player.User);
    expect(domain.willPlayerPassBeResign(Player.Opponent)).toBe(true);
  });
});
