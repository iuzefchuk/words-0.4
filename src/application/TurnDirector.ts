import Board, { CellIndex, Placement } from '@/domain/models/Board.ts';
import { Player } from '@/domain/enums.ts';
import { TileId } from '@/domain/models/Inventory.ts';
import TurnTracker, {
  TurnOutcome,
  TurnOutcomeType,
  ValidationError,
  ValidationResult,
} from '@/domain/models/TurnTracker.ts';
import { IdGenerator } from '@/shared/ports.ts';
import { GameResult } from '@/application/types.ts';
import { GameResultType } from '@/application/enums.ts';

export default class TurnDirector {
  private constructor(
    private readonly board: Board,
    private readonly tracker: TurnTracker,
    private readonly _gameResultLog: Array<GameResult>,
  ) {}

  static create({ board, idGenerator }: { board: Board; idGenerator: IdGenerator }): TurnDirector {
    const tracker = TurnTracker.create({ idGenerator });
    const director = new TurnDirector(board, tracker, []);
    director.startTurnForNextPlayer();
    return director;
  }

  static hydrate(data: unknown): TurnDirector {
    const director = Object.setPrototypeOf(data, TurnDirector.prototype) as TurnDirector;
    TurnTracker.hydrate(director.tracker);
    return director;
  }

  get currentPlayer(): Player {
    return this.tracker.currentPlayer;
  }

  get currentTurnCells(): ReadonlyArray<CellIndex> | undefined {
    return this.tracker.currentTurnCells;
  }

  get currentTurnError(): ValidationError | undefined {
    return this.tracker.currentTurnError;
  }

  get currentTurnScore(): number | undefined {
    return this.tracker.currentTurnScore;
  }

  get currentTurnWords(): ReadonlyArray<string> | undefined {
    return this.tracker.currentTurnWords;
  }

  get currentTurnIsValid(): boolean {
    return this.tracker.currentTurnIsValid;
  }

  get currentTurnTiles(): ReadonlyArray<TileId> {
    return this.tracker.currentTurnTiles;
  }

  get currentTurnPlacement(): Placement {
    return this.board.resolvePlacement(this.tracker.currentTurnTiles);
  }

  get previousTurnTiles(): ReadonlyArray<TileId> | undefined {
    return this.tracker.previousTurnTiles;
  }

  get historyHasOpponentTurns(): boolean {
    return this.tracker.hasOpponentTurns;
  }

  get outcomeHistory(): ReadonlyArray<TurnOutcome> {
    return [...this.tracker.outcomeHistory];
  }

  getScoreFor(player: Player): number {
    return this.tracker.getScoreFor(player);
  }

  willPlayerPassBeResign(player: Player): boolean {
    return this.tracker.willPlayerPassBeResign(player);
  }

  getGameResultFor(player: Player): GameResult | undefined {
    for (let i = this._gameResultLog.length - 1; i >= 0; i--) {
      if (this._gameResultLog[i].player === player) return this._gameResultLog[i];
    }
    return undefined;
  }

  placeTile({ cell, tile }: { cell: CellIndex; tile: TileId }): void {
    this.board.placeTile(cell, tile);
    this.tracker.placeTileInCurrentTurn(tile);
  }

  undoPlaceTile({ tile }: { tile: TileId }): void {
    this.tracker.undoPlaceTileInCurrentTurn({ tile });
    this.board.undoPlaceTile(tile);
  }

  setCurrentTurnValidation(result: ValidationResult): void {
    this.tracker.setCurrentTurnValidation(result);
  }

  resetCurrentTurn(): void {
    for (const tile of this.tracker.currentTurnTiles) {
      this.board.undoPlaceTile(tile);
    }
    this.tracker.resetCurrentTurn();
  }

  saveCurrentTurn(): void {
    if (!this.currentTurnIsValid) throw new Error('Turn is not valid');
    this.tracker.recordCurrentTurnOutcome(TurnOutcomeType.Save);
    this.startTurnForNextPlayer();
  }

  passCurrentTurn(): void {
    this.tracker.recordCurrentTurnOutcome(TurnOutcomeType.Pass);
    this.startTurnForNextPlayer();
  }

  resignCurrentTurn(): void {
    const loser = this.tracker.currentPlayer;
    const winner = this.tracker.nextPlayer;
    this._gameResultLog.push({ type: GameResultType.Lose, player: loser });
    this._gameResultLog.push({ type: GameResultType.Win, player: winner });
  }

  endGameByTileDepletion(players: ReadonlyArray<Player>): void {
    const scores = players.map(player => ({ player, score: this.getScoreFor(player) }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const allTied = scores.every(s => s.score === maxScore);
    if (allTied) {
      for (const { player } of scores) this._gameResultLog.push({ type: GameResultType.Tie, player });
    } else {
      for (const { player, score } of scores) {
        this._gameResultLog.push({ type: score === maxScore ? GameResultType.Win : GameResultType.Lose, player });
      }
    }
  }

  private startTurnForNextPlayer(): void {
    this.tracker.createNewTurnFor(this.tracker.nextPlayer);
  }
}
