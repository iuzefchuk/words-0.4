import { describe, it, expect } from 'vitest';
import PlaceTile from '@/application/commands/PlaceTile.ts';
import UndoPlaceTile from '@/application/commands/UndoPlaceTile.ts';
import { createTestContext, cellIndex } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';

describe('UndoPlaceTile', () => {
  it('removes a placed tile and re-validates', () => {
    const domain = createTestContext();
    const userTiles = domain.getTilesFor(Player.User);
    const tile = userTiles[0];

    PlaceTile.execute(domain, { cell: cellIndex(112), tile });
    expect(domain.isTilePlaced(tile)).toBe(true);

    UndoPlaceTile.execute(domain, tile);
    expect(domain.isTilePlaced(tile)).toBe(false);
    expect(domain.currentTurnTiles).toHaveLength(0);
  });

  it('re-validates after undo', () => {
    const domain = createTestContext();
    const userTiles = domain.getTilesFor(Player.User);

    PlaceTile.execute(domain, { cell: cellIndex(112), tile: userTiles[0] });
    PlaceTile.execute(domain, { cell: cellIndex(113), tile: userTiles[1] });

    UndoPlaceTile.execute(domain, userTiles[1]);
    // Only one tile left, validation re-runs
    expect(domain.currentTurnTiles).toHaveLength(1);
  });
});
