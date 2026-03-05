export class AnchorCellFinder {
  constructor(
    private readonly layout: Layout,
    private readonly turnManager: TurnManager,
  ) {}

  // TODO return as set
  execute(): ReadonlyArray<CellIndex> {
    return this.layout.cells.filter((cell: CellIndex) => this.isAnchor(cell));
  }

  private isAnchor(cell: CellIndex): boolean {
    const isCenter = this.layout.isCellCenter(cell);
    if (this.turnManager.historyIsEmpty) return isCenter;
    const isConnected = this.turnManager.isCellConnected(cell);
    if (isConnected) return false;
    const hasUsedAdjacentCells = this.layout
      .findAdjacentCells(cell)
      .some((adjacentCell: CellIndex) => this.turnManager.isCellConnected(adjacentCell));
    return isCenter || hasUsedAdjacentCells;
  }
}
