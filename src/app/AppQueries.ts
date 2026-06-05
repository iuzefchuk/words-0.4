import { GamePlayer } from '@/app/types/index.ts';
import Inventory from '@/domain/models/inventory/Inventory.ts';
import type {
  GameBoardView,
  GameBonus,
  GameCell,
  GameEvent,
  GameInventoryView,
  GameLetter,
  GameMatchDifficulty,
  GameMatchResult,
  GameMatchType,
  GameMatchView,
  GameTile,
  GameTurnsView,
} from '@/app/types/index.ts';
import type Game from '@/domain/Game.ts';

export default class AppQueries {
  get boardCells(): ReadonlyArray<GameCell> {
    return this.game.boardView.cells;
  }

  get boardCellsPerAxis(): number {
    return this.game.boardView.cellsPerAxis;
  }

  get currentPlayerIsUser(): boolean {
    return this.turnsView.currentPlayer === GamePlayer.User;
  }

  get currentTurnIsValid(): boolean {
    return this.turnsView.currentTurnIsValid;
  }

  get currentTurnScore(): number | undefined {
    return this.turnsView.currentTurnScore;
  }

  get eventsLog(): ReadonlyArray<GameEvent> {
    return this.game.eventsLogView;
  }

  get matchDifficulty(): GameMatchDifficulty {
    return this.matchView.difficulty;
  }

  get matchIsFinished(): boolean {
    return this.matchView.isFinished;
  }

  get matchResult(): GameMatchResult {
    return this.matchView.getResultFor(GamePlayer.User);
  }

  get matchType(): GameMatchType {
    return this.matchView.type;
  }

  get opponentScore(): number {
    return this.matchView.getScoreFor(GamePlayer.Opponent);
  }

  get settingsChangeIsAllowed(): boolean {
    return this.game.settingsChangeIsAllowed;
  }

  get tilesPerPlayer(): number {
    return this.game.inventoryView.tilesPerPlayer;
  }

  get tilesRemaining(): number {
    return this.inventoryView.unusedTilesCount;
  }

  get turnHistoryHasPriorTurns(): boolean {
    return this.turnsView.historyHasPriorTurns;
  }

  get userPassWillBeResign(): boolean {
    return this.game.willPassBeResignFor(GamePlayer.User);
  }

  get userScore(): number {
    return this.matchView.getScoreFor(GamePlayer.User);
  }

  get userTiles(): ReadonlyArray<GameTile> {
    return this.inventoryView.getTilesFor(GamePlayer.User);
  }

  private get boardView(): Readonly<GameBoardView> {
    return this.game.boardView;
  }

  private get inventoryView(): Readonly<GameInventoryView> {
    return this.game.inventoryView;
  }

  private get matchView(): Readonly<GameMatchView> {
    return this.game.matchView;
  }

  private get turnsView(): Readonly<GameTurnsView> {
    return this.game.turnsView;
  }

  constructor(private readonly game: Game) {}

  areTilesSame(first: GameTile, second: GameTile): boolean {
    return this.inventoryView.areTilesEqual(first, second);
  }

  findCellWithTile(tile: GameTile): GameCell | undefined {
    return this.boardView.findCellByTile(tile);
  }

  findTileOnCell(cell: GameCell): GameTile | undefined {
    return this.boardView.findTileByCell(cell);
  }

  getAdjacentCells(cell: GameCell): ReadonlyArray<GameCell> {
    return this.boardView.getAdjacentCells(cell);
  }

  getCellBonus(cell: GameCell): GameBonus | null {
    return this.boardView.getBonus(cell);
  }

  getCellColumnIndex(cell: GameCell): number {
    return this.boardView.getCellPositionInColumn(cell);
  }

  getCellRowIndex(cell: GameCell): number {
    return this.boardView.getCellPositionInRow(cell);
  }

  getLetterPoints(letter: GameLetter): number {
    return Inventory.getLetterPoints(letter);
  }

  getTileLetter(tile: GameTile): GameLetter {
    return this.inventoryView.getTileLetter(tile);
  }

  isCellCenter(cell: GameCell): boolean {
    return this.boardView.isCellCenter(cell);
  }

  isTilePlaced(tile: GameTile): boolean {
    return this.boardView.isTilePlaced(tile);
  }

  wasTileUsedInPreviousTurn(tile: GameTile): boolean {
    return this.game.wasTileUsedInPreviousTurn(tile);
  }
}
