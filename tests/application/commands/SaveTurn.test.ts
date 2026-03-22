import { describe, it, expect } from 'vitest';
import SaveTurn from '@/application/commands/SaveTurn.ts';
import { createTestContext, cellIndex, placeAndValidate, ALL_WORDS } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';

describe('SaveTurn', () => {
  it('returns error when turn has validation error', () => {
    const domain = createTestContext();
    // Validate with no tiles placed → InvalidTilePlacement
    domain.validateCurrentTurn();

    const result = SaveTurn.execute(domain);
    expect(result.ok).toBe(false);
  });

  it('saves a valid turn and returns words', () => {
    const domain = createTestContext({ words: ALL_WORDS });
    const userTiles = domain.getTilesFor(Player.User);

    placeAndValidate(domain, [
      { cell: cellIndex(112), tile: userTiles[0] },
      { cell: cellIndex(113), tile: userTiles[1] },
    ]);
    expect(domain.currentTurnIsValid).toBe(true);

    const result = SaveTurn.execute(domain);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.words.length).toBeGreaterThan(0);
    }
  });

  it('discards tiles and replenishes after saving', () => {
    const domain = createTestContext({ words: ALL_WORDS });
    const userTiles = domain.getTilesFor(Player.User);

    placeAndValidate(domain, [
      { cell: cellIndex(112), tile: userTiles[0] },
      { cell: cellIndex(113), tile: userTiles[1] },
    ]);

    const unusedBefore = domain.unusedTilesCount;
    SaveTurn.execute(domain);
    // Two tiles discarded, two drawn: net change = -2
    expect(domain.unusedTilesCount).toBe(unusedBefore - 2);
    // Player should still have 7 tiles (replenished)
    expect(domain.getTilesFor(Player.User)).toHaveLength(7);
  });

  it('advances to next player after saving', () => {
    const domain = createTestContext({ words: ALL_WORDS });
    const userTiles = domain.getTilesFor(Player.User);

    placeAndValidate(domain, [
      { cell: cellIndex(112), tile: userTiles[0] },
      { cell: cellIndex(113), tile: userTiles[1] },
    ]);

    SaveTurn.execute(domain);
    expect(domain.currentPlayer).toBe(Player.Opponent);
  });
});
