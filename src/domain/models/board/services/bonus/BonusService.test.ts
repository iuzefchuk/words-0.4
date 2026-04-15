import Board from '@/domain/models/board/Board.ts';
import { BoardType, Bonus } from '@/domain/models/board/enums.ts';
import BonusService from '@/domain/models/board/services/bonus/BonusService.ts';
import { BonusDistribution } from '@/domain/models/board/types.ts';
import CryptoSeedingService from '@/infrastructure/services/CryptoSeedingService.ts';

const countBonusOccurrences = (distribution: BonusDistribution): Map<Bonus, number> => {
  const occurrences = new Map<Bonus, number>();
  for (const bonus of distribution.values()) occurrences.set(bonus, (occurrences.get(bonus) ?? 0) + 1);
  return occurrences;
};

describe('BonusService', () => {
  let classicDistribution: BonusDistribution;
  let randomDistribution: BonusDistribution;

  beforeAll(() => {
    const seedingService = new CryptoSeedingService();
    const seed = seedingService.createSeed();
    const randomizerForBoard = seedingService.createRandomizer(seed);
    classicDistribution = BonusService.createBonusDistribution(BoardType.Classic);
    randomDistribution = BonusService.createBonusDistribution(BoardType.Random, randomizerForBoard);
  });

  it('has same count for different distributions', () => {
    expect(classicDistribution.size).toBe(randomDistribution.size);
  });

  describe('has same count of each bonus for different distributions', () => {
    const bonusTypes = Object.values(Bonus).map(b => [b] as const);
    let classicOccurrences: Map<Bonus, number>;
    let randomOccurrences: Map<Bonus, number>;

    beforeAll(() => {
      classicOccurrences = countBonusOccurrences(classicDistribution);
      randomOccurrences = countBonusOccurrences(randomDistribution);
    });

    it.each(bonusTypes)('bonus %s', bonusType => {
      expect(classicOccurrences.get(bonusType)).toBe(randomOccurrences.get(bonusType));
    });
  });

  const distributions = [
    ['classic', () => classicDistribution],
    ['random', () => randomDistribution],
  ] as const;

  it.each(distributions)('%s distribution excludes center cell', (_, getDist) => {
    expect(getDist().has(Board.CENTER_CELL)).toBe(false);
  });

  const validCells = new Set(Board.CELLS_BY_INDEX);
  const validBonusValues = new Set(Object.values(Bonus));

  it.each(distributions)('%s distribution contains only valid board cells', (_, getDist) => {
    const invalidCells = Array.from(getDist().keys()).filter(cell => !validCells.has(cell));
    expect(invalidCells).toEqual([]);
  });

  it.each(distributions)('%s distribution contains only valid bonus values', (_, getDist) => {
    const invalidBonuses = Array.from(getDist().values()).filter(bonus => !validBonusValues.has(bonus));
    expect(invalidBonuses).toEqual([]);
  });
});

describe('Board using BonusService', () => {
  const cells = Board.CELLS_BY_INDEX.map(cell => [cell] as const);

  describe('classic board', () => {
    const classicDistribution = BonusService.createBonusDistribution(BoardType.Classic);
    const classicBoard = Board.create(BoardType.Classic);

    it.each(cells)('applies distribution correctly for cell %i', cell => {
      const expectedBonus = classicDistribution.get(cell) ?? null;
      expect(classicBoard.getBonus(cell)).toBe(expectedBonus);
    });
  });

  describe('random board', () => {
    const seedingService = new CryptoSeedingService();
    const seed = seedingService.createSeed();
    const randomizerForBoard = seedingService.createRandomizer(seed);
    const randomizerForDistribution = seedingService.createRandomizer(seed);
    const randomBoard = Board.create(BoardType.Random, randomizerForBoard);
    const randomDistribution = BonusService.createBonusDistribution(BoardType.Random, randomizerForDistribution);

    it.each(cells)('applies distribution correctly for cell %i', cell => {
      const expectedBonus = randomDistribution.get(cell) ?? null;
      expect(randomBoard.getBonus(cell)).toBe(expectedBonus);
    });
  });
});
