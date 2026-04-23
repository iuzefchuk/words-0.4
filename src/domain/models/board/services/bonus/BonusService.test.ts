import { describe, expect, test } from 'vitest';
import { Type } from '@/domain/models/board/enums.ts';
import BonusService from '@/domain/models/board/services/bonus/BonusService.ts';
import LayoutService from '@/domain/models/board/services/layout/LayoutService.ts';
import { BonusDistribution, Cell } from '@/domain/models/board/types.ts';

// test does not measure exact count and positions of bonuses

type TypePairCases = {
  readonly randomizer: () => number;
  readonly referenceDistribution: BonusDistribution;
  readonly referenceType: Type;
  readonly variableType: Type;
};

type TypePresetCases = {
  readonly anotherInvocation: BonusDistribution;
  readonly symmetryQuadruples: ReadonlyArray<readonly [Cell, Cell, Cell, Cell]>;
  readonly type: Type;
};

type TypeRandomCases = {
  readonly anotherInvocation: BonusDistribution;
  readonly differentInvocation: BonusDistribution;
  readonly randomizer: () => number;
  readonly type: Type;
};

type TypeSingleCases = {
  readonly centerCell: Cell;
  readonly type: Type;
};

class BonusServiceCases {
  static forTypePair(): ReadonlyArray<TypePairCases> {
    const referenceType = Type.Preset;
    return [
      {
        randomizer: () => 0,
        referenceDistribution: BonusService.createDistribution(referenceType),
        referenceType,
        variableType: Type.Random,
      },
    ];
  }

  static forTypePreset(): ReadonlyArray<TypePresetCases> {
    return [
      {
        anotherInvocation: BonusService.createDistribution(Type.Preset),
        symmetryQuadruples: this.buildSymmetryQuadruples(),
        type: Type.Preset,
      },
    ];
  }

  static forTypeRandom(): ReadonlyArray<TypeRandomCases> {
    const randomizer = (): number => 0.5;
    const differentRandomizer = (): number => 0.25;
    return [
      {
        anotherInvocation: BonusService.createDistribution(Type.Random, randomizer),
        differentInvocation: BonusService.createDistribution(Type.Random, differentRandomizer),
        randomizer,
        type: Type.Random,
      },
    ];
  }

  static forTypeSingle(): ReadonlyArray<TypeSingleCases> {
    const centerCell = LayoutService.CENTER_CELL;
    return [
      { centerCell, type: Type.Preset },
      { centerCell, type: Type.Random },
    ];
  }

  private static buildSymmetryQuadruples(): ReadonlyArray<readonly [Cell, Cell, Cell, Cell]> {
    const size = LayoutService.CELLS_PER_AXIS;
    const last = size - 1;
    const quadruples: Array<readonly [Cell, Cell, Cell, Cell]> = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        quadruples.push([
          (row * size + col) as Cell,
          (row * size + (last - col)) as Cell,
          ((last - row) * size + col) as Cell,
          (col * size + row) as Cell,
        ]);
      }
    }
    return quadruples;
  }
}

describe('BonusService', () => {
  describe.each(BonusServiceCases.forTypeSingle())('for $type', ({ centerCell, type }) => {
    test('distribution excludes center cell', () => {
      expect(BonusService.createDistribution(type).has(centerCell)).toBe(false);
    });
  });

  describe.each(BonusServiceCases.forTypePreset())('for $type', ({ anotherInvocation, symmetryQuadruples, type }) => {
    test('always returns same distribution', () => {
      expect(BonusService.createDistribution(type)).toEqual(anotherInvocation);
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

  describe.each(BonusServiceCases.forTypeRandom())(
    'for $type',
    ({ anotherInvocation, differentInvocation, randomizer, type }) => {
      test('same randomizer returns same distribution', () => {
        expect(BonusService.createDistribution(type, randomizer)).toEqual(anotherInvocation);
      });

      test('different randomizer returns different distribution', () => {
        expect(BonusService.createDistribution(type, randomizer)).not.toEqual(differentInvocation);
      });
    },
  );

  describe.each(BonusServiceCases.forTypePair())(
    'for $referenceType vs $variableType',
    ({ randomizer, referenceDistribution, variableType }) => {
      test('variable preserves reference bonus counts', () => {
        const variable = BonusService.createDistribution(variableType, randomizer);
        expect([...variable.values()].sort()).toEqual([...referenceDistribution.values()].sort());
      });

      test('variable differs from reference', () => {
        const variable = BonusService.createDistribution(variableType, randomizer);
        expect(variable).not.toEqual(referenceDistribution);
      });
    },
  );
});
