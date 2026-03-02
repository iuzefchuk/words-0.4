import { Axis, CellIndex, Coordinates, Layout } from '../Layout/Layout.js';
import { Inventory, Letter } from '../Inventory/Inventory.js';
import { Placement, TurnManager } from './_Turn.js';
import { CellUsabilityCalculator } from '../Layout/CellUsabilityCalculator.js';
import { Dictionary } from '../Dictionary/Dictionary.js';
import { Player } from '../Player.js';
import { PlacementComputer } from './PlacementComputer.js';
import { CachedUsableLettersComputer, UsableLettersComputer } from './UsableLettersComputer.js';

export class PlacementGenerator {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnManager: TurnManager,
  ) {}

  execute(player: Player): Placement | null {
    const playerLetterTiles = this.inventory.getletterTilesFor(player);
    if (playerLetterTiles.size === 0) return null;
    const availableTargetCells = new CellUsabilityCalculator(this.layout, this.turnManager).getAllUsableAsFirst();
    if (availableTargetCells.length === 0) return null;
    const lettersComputer = new UsableLettersComputer(this.layout, this.dictionary, this.inventory, this.turnManager);
    const cachedLettersComputer = new PlacementGenerator.CachedUsableLettersComputer(lettersComputer);
    for (const cell of availableTargetCells) {
      for (const axis of Object.values(Axis)) {
        const input = new PlacementComputer(
          this.layout,
          this.dictionary,
          this.inventory,
          this.turnManager,
          cachedLettersComputer,
        ).execute({ playerLetterTiles, coords: { axis, cell } });
        if (input) return input;
      }
    }
    return null;
  }

  static CachedUsableLettersComputer = class implements CachedUsableLettersComputer {
    private cache = new Map<Axis, Map<CellIndex, ReadonlySet<Letter>>>(
      Object.values(Axis).map(axis => [axis, new Map()]),
    );

    constructor(private readonly computer: UsableLettersComputer) {}

    getFor(coords: Coordinates): ReadonlySet<Letter> {
      const axisCache = this.cache.get(coords.axis)!;
      const cachedResult = axisCache.get(coords.cell);
      if (cachedResult) return cachedResult;
      const newResult = this.computer.execute(coords);
      axisCache.set(coords.cell, newResult);
      return newResult;
    }
  };
}
