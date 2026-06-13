import { DomainMatchPlayer } from '@/app/enums/index.ts';
import { DomainPlayfield } from '@/app/types/index.ts';
import type {
  DomainInventoryLetter,
  DomainMatchDifficulty,
  DomainMatchResult,
  DomainMatchType,
  DomainPlayfieldBonus,
} from '@/app/enums/index.ts';
import type {
  DomainInventoryTile,
  DomainMatchProjection,
  DomainPlayfieldCell,
  DomainTimelineEvent,
  DomainTimelineProjection,
} from '@/app/types/index.ts';
import type { default as DomainGame } from '@/domain/aggregates/Game.ts';

export default class AppQueries {
  get currentPlayerIsUser(): boolean {
    return this.matchProjection.currentPlayer === DomainMatchPlayer.User;
  }

  get currentTurnIsValid(): boolean {
    return this.matchProjection.currentTurnIsValid;
  }

  get currentTurnScore(): number | undefined {
    return this.matchProjection.currentTurnScore;
  }

  get eventsView(): ReadonlyArray<DomainTimelineEvent> {
    return this.timelineView.eventList;
  }

  get matchDifficulty(): DomainMatchDifficulty {
    return this.matchProjection.settings.difficulty;
  }

  get matchIsFinished(): boolean {
    return this.matchProjection.isFinished;
  }

  get matchResult(): DomainMatchResult {
    return this.matchProjection.getResultFor(DomainMatchPlayer.User);
  }

  get matchType(): DomainMatchType {
    return this.matchProjection.settings.type;
  }

  get opponentScore(): number {
    return this.matchProjection.getScoreFor(DomainMatchPlayer.Opponent);
  }

  get playfieldCells(): ReadonlyArray<DomainPlayfieldCell> {
    return this.matchProjection.playfieldCells;
  }

  get playfieldCellsPerAxis(): number {
    return this.matchProjection.playfieldCellsPerAxis;
  }

  get settingsChangeIsAllowed(): boolean {
    return !this.matchProjection.historyHasPriorTurns;
  }

  get tilesPerPlayer(): number {
    return this.matchProjection.tilesPerPlayer;
  }

  get tilesRemaining(): number {
    return this.matchProjection.unusedTilesCount;
  }

  get turnHistoryHasPriorTurns(): boolean {
    return this.matchProjection.historyHasPriorTurns;
  }

  get userPassWillBeResign(): boolean {
    return this.matchProjection.willPlayerPassBeResign(DomainMatchPlayer.User);
  }

  get userScore(): number {
    return this.matchProjection.getScoreFor(DomainMatchPlayer.User);
  }

  get userTiles(): ReadonlyArray<DomainInventoryTile> {
    return this.matchProjection.getTilesFor(DomainMatchPlayer.User);
  }

  private get matchProjection(): Readonly<DomainMatchProjection> {
    return this.game.matchProjection;
  }

  private get timelineView(): Readonly<DomainTimelineProjection> {
    return this.game.timelineProjection;
  }

  constructor(private readonly game: DomainGame) {}

  areTilesSame(first: DomainInventoryTile, second: DomainInventoryTile): boolean {
    return this.matchProjection.areTilesEqual(first, second);
  }

  findCellWithTile(tile: DomainInventoryTile): DomainPlayfieldCell | undefined {
    return this.matchProjection.findCellByTile(tile);
  }

  findTileOnCell(cell: DomainPlayfieldCell): DomainInventoryTile | undefined {
    return this.matchProjection.findTileByCell(cell);
  }

  getAdjacentCells(cell: DomainPlayfieldCell): ReadonlyArray<DomainPlayfieldCell> {
    return DomainPlayfield.getAdjacentCells(cell);
  }

  getCellBonus(cell: DomainPlayfieldCell): DomainPlayfieldBonus | null {
    return this.matchProjection.getCellBonus(cell);
  }

  getCellColumnIndex(cell: DomainPlayfieldCell): number {
    return DomainPlayfield.getCellPositionInColumn(cell);
  }

  getCellRowIndex(cell: DomainPlayfieldCell): number {
    return DomainPlayfield.getCellPositionInRow(cell);
  }

  getLetterPoints(letter: DomainInventoryLetter): number {
    return this.matchProjection.getLetterPoints(letter);
  }

  getTileLetter(tile: DomainInventoryTile): DomainInventoryLetter {
    return this.matchProjection.getTileLetter(tile);
  }

  isCellCenter(cell: DomainPlayfieldCell): boolean {
    return DomainPlayfield.isCellCenter(cell);
  }

  isTilePlaced(tile: DomainInventoryTile): boolean {
    return this.matchProjection.isTilePlaced(tile);
  }

  wasTileUsedInPreviousTurn(tile: DomainInventoryTile): boolean {
    return this.matchProjection.previousTurnTiles?.includes(tile) ?? false;
  }
}
