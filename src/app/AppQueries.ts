import { DomainMatchPlayer } from '@/app/enums/index.ts';
import type { DomainPlayfieldBonus, DomainInventoryLetter, DomainMatchDifficulty, DomainMatchResult, DomainMatchType } from '@/app/enums/index.ts';
import type {
  DomainPlayfieldCell,
  DomainPlayfieldProjection,
  DomainInventoryProjection,
  DomainInventoryTile,
  DomainMatchProjection,
  DomainTimelineEvent,
} from '@/app/types/index.ts';
import type { default as DomainGame } from '@/domain/aggregates/Game.ts';

export default class AppQueries {
  get playfieldCells(): ReadonlyArray<DomainPlayfieldCell> {
    return this.playfieldView.cells;
  }

  get playfieldCellsPerAxis(): number {
    return this.playfieldView.cellsPerAxis;
  }

  get currentPlayerIsUser(): boolean {
    return this.matchView.currentPlayer === DomainMatchPlayer.User;
  }

  get currentTurnIsValid(): boolean {
    return this.matchView.currentTurnIsValid;
  }

  get currentTurnScore(): number | undefined {
    return this.matchView.currentTurnScore;
  }

  get eventsView(): ReadonlyArray<DomainTimelineEvent> {
    return this.game.eventsView;
  }

  get matchDifficulty(): DomainMatchDifficulty {
    return this.matchView.difficulty;
  }

  get matchIsFinished(): boolean {
    return this.matchView.isFinished;
  }

  get matchResult(): DomainMatchResult {
    return this.matchView.getResultFor(DomainMatchPlayer.User);
  }

  get matchType(): DomainMatchType {
    return this.matchView.type;
  }

  get opponentScore(): number {
    return this.matchView.getScoreFor(DomainMatchPlayer.Opponent);
  }

  get settingsChangeIsAllowed(): boolean {
    return !this.matchView.historyHasPriorTurns;
  }

  get tilesPerPlayer(): number {
    return this.inventoryView.tilesPerPlayer;
  }

  get tilesRemaining(): number {
    return this.inventoryView.unusedTilesCount;
  }

  get turnHistoryHasPriorTurns(): boolean {
    return this.matchView.historyHasPriorTurns;
  }

  get userPassWillBeResign(): boolean {
    return this.matchView.willPlayerPassBeResign(DomainMatchPlayer.User);
  }

  get userScore(): number {
    return this.matchView.getScoreFor(DomainMatchPlayer.User);
  }

  get userTiles(): ReadonlyArray<DomainInventoryTile> {
    return this.inventoryView.getTilesFor(DomainMatchPlayer.User);
  }

  private get playfieldView(): Readonly<DomainPlayfieldProjection> {
    return this.game.playfieldView;
  }

  private get inventoryView(): Readonly<DomainInventoryProjection> {
    return this.game.inventoryView;
  }

  private get matchView(): Readonly<DomainMatchProjection> {
    return this.game.matchView;
  }

  constructor(private readonly game: DomainGame) {}

  areTilesSame(first: DomainInventoryTile, second: DomainInventoryTile): boolean {
    return this.inventoryView.areTilesEqual(first, second);
  }

  findCellWithTile(tile: DomainInventoryTile): DomainPlayfieldCell | undefined {
    return this.playfieldView.findCellByTile(tile);
  }

  findTileOnCell(cell: DomainPlayfieldCell): DomainInventoryTile | undefined {
    return this.playfieldView.findTileByCell(cell);
  }

  getAdjacentCells(cell: DomainPlayfieldCell): ReadonlyArray<DomainPlayfieldCell> {
    return this.playfieldView.getAdjacentCells(cell);
  }

  getCellBonus(cell: DomainPlayfieldCell): DomainPlayfieldBonus | null {
    return this.playfieldView.getBonus(cell);
  }

  getCellColumnIndex(cell: DomainPlayfieldCell): number {
    return this.playfieldView.getCellPositionInColumn(cell);
  }

  getCellRowIndex(cell: DomainPlayfieldCell): number {
    return this.playfieldView.getCellPositionInRow(cell);
  }

  getLetterPoints(letter: DomainInventoryLetter): number {
    return this.inventoryView.getLetterPoints(letter);
  }

  getTileLetter(tile: DomainInventoryTile): DomainInventoryLetter {
    return this.inventoryView.getTileLetter(tile);
  }

  isCellCenter(cell: DomainPlayfieldCell): boolean {
    return this.playfieldView.isCellCenter(cell);
  }

  isTilePlaced(tile: DomainInventoryTile): boolean {
    return this.playfieldView.isTilePlaced(tile);
  }

  wasTileUsedInPreviousTurn(tile: DomainInventoryTile): boolean {
    return this.matchView.previousTurnTiles?.includes(tile) ?? false;
  }
}
