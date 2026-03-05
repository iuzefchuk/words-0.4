import { Player, Axis, Letter } from '@/domain/enums.js';
import { AnchorLettersComputer, CachedAnchorLettersComputer } from '@/domain/Turn/computation/AnchorLettersComputer.js';
import { AnchorCellFinder } from '@/domain/Turn/search/AnchorCellFinder.js';
import { PlacementGenerator } from '@/domain/Turn/generation/PlacementGenerator.js';

export class InitialPlacementGenerator {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnManager: TurnManager,
  ) {}

  *execute(player: Player): Generator<Placement> {
    const playerTileCollection = this.inventory.getTileCollectionFor(player);
    if (playerTileCollection.size === 0) return;
    const anchorCells = new AnchorCellFinder(this.layout, this.turnManager).execute();
    if (anchorCells.length === 0) return;
    const anchorLettersComputer = new AnchorLettersComputer(
      this.layout,
      this.dictionary,
      this.inventory,
      this.turnManager,
    );
    const cachedAnchorLettersComputer = new InitialPlacementGenerator.CachedAnchorLettersComputer(
      anchorLettersComputer,
    );
    for (const cell of anchorCells) {
      for (const axis of Object.values(Axis)) {
        const coords: AnchorCoordinates = { axis, index: cell };
        const generator = new PlacementGenerator(
          this.layout,
          this.dictionary,
          this.inventory,
          this.turnManager,
          cachedAnchorLettersComputer,
        );
        for (const placement of generator.execute({ playerTileCollection, coords })) yield placement;
      }
    }
  }

  static CachedAnchorLettersComputer = class implements CachedAnchorLettersComputer {
    private cache = new Map<Axis, Map<CellIndex, ReadonlySet<Letter>>>(
      Object.values(Axis).map(axis => [axis, new Map()]),
    );

    constructor(private readonly computer: AnchorLettersComputer) {}

    find(coords: AnchorCoordinates): ReadonlySet<Letter> {
      const axisCache = this.cache.get(coords.axis)!;
      const cachedResult = axisCache.get(coords.index);
      if (cachedResult) return cachedResult;
      const newResult = this.computer.execute(coords);
      axisCache.set(coords.index, newResult);
      return newResult;
    }
  };
}
