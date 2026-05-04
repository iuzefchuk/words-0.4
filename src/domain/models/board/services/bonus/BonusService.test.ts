import { describe, expect, test } from 'vitest';
import { Type } from '@/domain/models/board/enums.ts';
import BonusService from '@/domain/models/board/services/bonus/BonusService.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { Cell } from '@/domain/models/board/types.ts';

function buildSymmetryQuadruples(size: number): ReadonlyArray<readonly [number, number, number, number]> {
  const last = size - 1;
  const quadruples: Array<readonly [number, number, number, number]> = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      quadruples.push([row * size + col, row * size + (last - col), (last - row) * size + col, col * size + row]);
    }
  }
  return quadruples;
}

describe('BonusService', () => {
  describe('createDistribution', () => {
    describe.each(Object.values(Type))('for %s', type => {
      const distribution = BonusService.createDistribution(type);
      const distributionsFromOtherTypes = Object.values(Type)
        .filter(someType => someType !== type)
        .map(otherType => BonusService.createDistribution(otherType));
      test('returns not empty result', () => {
        expect(distribution.size).toBeGreaterThan(0);
      });
      test('returns not full result', () => {
        expect(distribution.size).toBeLessThan(LayoutService.CELLS.length);
      });
      describe.each(distributionsFromOtherTypes)('comparing w/ others', otherDistribution => {
        test('returns different result', () => {
          expect(distribution).not.toEqual(otherDistribution);
        });
        test('returns same size result', () => {
          expect(distribution.size).toBe(otherDistribution.size);
        });
      });
    });
    describe('only for Preset', () => {
      const presetDistribution = BonusService.createDistribution(Type.Preset);
      test('returns same result', () => {
        expect(presetDistribution).toEqual(BonusService.createDistribution(Type.Preset));
      });
      test('returns D4-symmetric result', () => {
        const symmetryQuadruples = buildSymmetryQuadruples(LayoutService.CELLS_PER_AXIS) as ReadonlyArray<
          readonly [Cell, Cell, Cell, Cell]
        >;
        const asymmetric = symmetryQuadruples.filter(([origin, horizontal, vertical, diagonal]) => {
          const originBonus = presetDistribution.get(origin);
          return (
            presetDistribution.get(horizontal) !== originBonus ||
            presetDistribution.get(vertical) !== originBonus ||
            presetDistribution.get(diagonal) !== originBonus
          );
        });
        expect(asymmetric).toEqual([]);
      });
    });
    describe('only for Random', () => {
      describe('w/ same randomizer', () => {
        test('returns same result', () => {
          const randomizer = (): number => 0.5;
          const actual = BonusService.createDistribution(Type.Random, randomizer);
          const expected = BonusService.createDistribution(Type.Random, randomizer);
          expect(actual).toEqual(expected);
        });
      });
      describe('w/ different randomizers', () => {
        test('returns different result', () => {
          const firstRandomizer = (): number => 0.25;
          const secondRandomizer = (): number => 0.5;
          const actual = BonusService.createDistribution(Type.Random, firstRandomizer);
          const notExpected = BonusService.createDistribution(Type.Random, secondRandomizer);
          expect(actual).not.toEqual(notExpected);
        });
      });
      describe('w/out randomizer', () => {
        test('returns different result', () => {
          const actual = BonusService.createDistribution(Type.Random);
          const notExpected = BonusService.createDistribution(Type.Random);
          expect(actual).not.toEqual(notExpected);
        });
      });
    });
  });
});
