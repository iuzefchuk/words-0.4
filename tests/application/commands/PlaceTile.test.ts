import { describe, it, expect } from 'vitest';
import PlaceTile from '@/application/commands/PlaceTile.ts';
import { createTestContext, cellIndex } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';

describe('PlaceTile', () => {
  it('places a tile and runs validation', () => {
    const domain = createTestContext();
    const userTiles = domain.getTilesFor(Player.User);
    const tile = userTiles[0];

    PlaceTile.execute(domain, { cell: cellIndex(112), tile });

    expect(domain.isTilePlaced(tile)).toBe(true);
    expect(domain.currentTurnTiles).toHaveLength(1);
    // Validation should have run (score or error should be set)
    const hasValidation =
      domain.currentTurnError !== undefined || domain.currentTurnScore !== undefined;
    expect(hasValidation).toBe(true);
  });

  it('places multiple tiles and validates', () => {
    const domain = createTestContext();
    const userTiles = domain.getTilesFor(Player.User);

    PlaceTile.execute(domain, { cell: cellIndex(112), tile: userTiles[0] });
    PlaceTile.execute(domain, { cell: cellIndex(113), tile: userTiles[1] });

    expect(domain.currentTurnTiles).toHaveLength(2);
  });
});
