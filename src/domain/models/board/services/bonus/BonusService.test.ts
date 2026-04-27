import BonusDistributionFixtures from '$/fixtures/BonusDistributionFixtures.ts';
import { describe, expect, test } from 'vitest';
import { Type } from '@/domain/models/board/enums.ts';
import BonusService from '@/domain/models/board/services/bonus/BonusService.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { Cell } from '@/domain/models/board/types.ts';

// test does not verify exact positions of preset bonuses nor absolute per-type counts —
// only invariants (D4 symmetry, non-emptiness, count parity between preset and random).
// Random is pinned to a fixture only for randomizer () => 0.5; other randomizers are
// checked structurally (same vs different) against the method's own output.

type TypeNegativeCases = {
  readonly error: new (...args: Array<unknown>) => Error;
  readonly message?: RegExp | string;
  readonly type: Type;
};

type TypePositivePairCases = {
  readonly randomizer: () => number;
  readonly referenceType: Type;
  readonly variableType: Type;
};

type TypePositivePresetCases = {
  readonly symmetryQuadruples: ReadonlyArray<readonly [Cell, Cell, Cell, Cell]>;
  readonly type: Type;
};

type TypePositiveRandomCases = {
  readonly differentRandomizer: () => number;
  readonly randomizer: () => number;
  readonly type: Type;
};

type TypePositiveSingleCases = {
  readonly centerCell: Cell;
  readonly type: Type;
};

class BonusServiceCases {
  static forTypeNegative(): ReadonlyArray<TypeNegativeCases> {
    return [
      {
        error: ReferenceError,
        message: /unexpected board type/,
        type: 'Invalid' as Type,
      },
    ];
  }

  static forTypePositivePair(): ReadonlyArray<TypePositivePairCases> {
    return [
      {
        randomizer: () => 0,
        referenceType: Type.Preset,
        variableType: Type.Random,
      },
    ];
  }

  static forTypePositivePreset(): ReadonlyArray<TypePositivePresetCases> {
    return [
      {
        symmetryQuadruples: this.buildSymmetryQuadruples(LayoutService.CELLS_PER_AXIS) as ReadonlyArray<
          readonly [Cell, Cell, Cell, Cell]
        >,
        type: Type.Preset,
      },
    ];
  }

  static forTypePositiveRandom(): ReadonlyArray<TypePositiveRandomCases> {
    return [
      {
        differentRandomizer: (): number => 0.25,
        randomizer: (): number => 0.5,
        type: Type.Random,
      },
    ];
  }

  static forTypePositiveSingle(): ReadonlyArray<TypePositiveSingleCases> {
    const centerCell = LayoutService.CENTER_CELL;
    return [
      { centerCell, type: Type.Preset },
      { centerCell, type: Type.Random },
    ];
  }

  private static buildSymmetryQuadruples(size: number): ReadonlyArray<readonly [number, number, number, number]> {
    const last = size - 1;
    const quadruples: Array<readonly [number, number, number, number]> = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        quadruples.push([row * size + col, row * size + (last - col), (last - row) * size + col, col * size + row]);
      }
    }
    return quadruples;
  }
}

describe('BonusService', () => {
  describe.each(BonusServiceCases.forTypeNegative())('for invalid type $type', ({ error, message, type }) => {
    test('createDistribution throws', () => {
      const act = (): unknown => BonusService.createDistribution(type);
      expect(act).toThrow(error);
      if (message !== undefined) expect(act).toThrow(message);
    });
  });

  describe.each(BonusServiceCases.forTypePositivePair())(
    'for $referenceType vs $variableType',
    ({ randomizer, referenceType, variableType }) => {
      test('variable preserves reference bonus counts', () => {
        const reference = BonusService.createDistribution(referenceType);
        const variable = BonusService.createDistribution(variableType, randomizer);
        expect([...variable.values()].sort()).toEqual([...reference.values()].sort());
      });

      test('variable differs from reference', () => {
        const reference = BonusService.createDistribution(referenceType);
        const variable = BonusService.createDistribution(variableType, randomizer);
        expect(variable).not.toEqual(reference);
      });
    },
  );

  describe.each(BonusServiceCases.forTypePositivePreset())('for $type', ({ symmetryQuadruples, type }) => {
    test('always returns same distribution', () => {
      expect(BonusService.createDistribution(type)).toEqual(BonusService.createDistribution(type));
    });

    test('distribution is not empty', () => {
      expect(BonusService.createDistribution(type).size).toBeGreaterThan(0);
    });

    test('distribution is D4-symmetric', () => {
      const distribution = BonusService.createDistribution(type);
      for (const [origin, horizontal, vertical, diagonal] of symmetryQuadruples) {
        const originBonus = distribution.get(origin);
        expect(distribution.get(horizontal)).toBe(originBonus);
        expect(distribution.get(vertical)).toBe(originBonus);
        expect(distribution.get(diagonal)).toBe(originBonus);
      }
    });
  });

  describe.each(BonusServiceCases.forTypePositiveRandom())('for $type', ({ differentRandomizer, randomizer, type }) => {
    test('same randomizer returns same distribution', () => {
      expect(BonusService.createDistribution(type, randomizer)).toEqual(BonusService.createDistribution(type, randomizer));
    });

    test('different randomizer returns different distribution', () => {
      expect(BonusService.createDistribution(type, randomizer)).not.toEqual(
        BonusService.createDistribution(type, differentRandomizer),
      );
    });

    test('distribution matches precomputed fixture', () => {
      expect(BonusService.createDistribution(type, randomizer)).toEqual(BonusDistributionFixtures.randomAtHalf());
    });
  });

  describe.each(BonusServiceCases.forTypePositiveSingle())('for $type', ({ centerCell, type }) => {
    test('distribution excludes center cell', () => {
      expect(BonusService.createDistribution(type).has(centerCell)).toBe(false);
    });
  });
});
