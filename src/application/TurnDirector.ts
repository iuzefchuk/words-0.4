import Board, { CellIndex } from '@/domain/models/Board.ts';
import { Player } from '@/domain/enums.ts';
import { TileId } from '@/domain/models/Inventory.ts';
import TurnHistory, {
  TurnOutcome,
  PlacementLinks,
  TurnOutcomeType,
  ValidationError,
  ValidationResult,
} from '@/domain/models/TurnHistory.ts';
import { IdGenerator } from '@/shared/ports.ts';

export default class TurnDirector {
  private constructor(
    private readonly board: Board,
    private readonly history: TurnHistory,
  ) {}

  static create({ board, idGenerator }: { board: Board; idGenerator: IdGenerator }): TurnDirector {
    const history = TurnHistory.create({ idGenerator });
    const director = new TurnDirector(board, history);
    director.startTurnForNextPlayer();
    return director;
  }

  static hydrate(data: unknown): TurnDirector {
    const director = Object.setPrototypeOf(data, TurnDirector.prototype) as TurnDirector;
    TurnHistory.hydrate(director.history);
    return director;
  }

  get currentPlayer(): Player {
    return this.history.currentPlayer;
  }

  get currentTurnCellSequence(): ReadonlyArray<CellIndex> | undefined {
    return this.history.currentTurnCellSequence;
  }

  get currentTurnTileSequence(): ReadonlyArray<TileId> | undefined {
    return this.history.currentTurnTileSequence;
  }

  get currentTurnError(): ValidationError | undefined {
    return this.history.currentTurnError;
  }

  get currentTurnScore(): number | undefined {
    return this.history.currentTurnScore;
  }

  get currentTurnWords(): ReadonlyArray<string> | undefined {
    return this.history.currentTurnWords;
  }

  get currentTurnIsValid(): boolean {
    return this.history.currentTurnIsValid;
  }

  get currentTurnPlacementLinks(): PlacementLinks {
    return this.history.currentTurnPlacementLinks;
  }

  get previousTurnTileSequence(): ReadonlyArray<TileId> | undefined {
    return this.history.previousTurnTileSequence;
  }

  get historyHasOpponentTurns(): boolean {
    return this.history.hasOpponentTurns;
  }

  getScoreFor(player: Player): number {
    return this.history.getScoreFor(player);
  }

  willPlayerPassBeResign(player: Player): boolean {
    return this.history.willPlayerPassBeResign(player);
  }

  getLastOutcomeFor(player: Player): TurnOutcome | undefined {
    return this.history.getLastOutcomeFor(player);
  }

  get outcomeLog(): ReadonlyArray<TurnOutcome> {
    return this.history.outcomeLog;
  }

  placeTile({ cell, tile }: { cell: CellIndex; tile: TileId }): void {
    this.history.placeTileInCurrentTurn({ cell, tile });
    this.board.placeTile(cell, tile);
  }

  undoPlaceTile({ tile }: { tile: TileId }): void {
    this.history.undoPlaceTileInCurrentTurn({ tile });
    this.board.undoPlaceTile(tile);
  }

  setCurrentTurnValidation(result: ValidationResult): void {
    this.history.setCurrentTurnValidation(result);
  }

  resetCurrentTurn(): void {
    for (const { tile } of this.history.currentTurnPlacementLinks) {
      this.board.undoPlaceTile(tile);
    }
    this.history.resetCurrentTurn();
  }

  saveCurrentTurn(): void {
    if (!this.currentTurnIsValid) throw new Error('Turn is not valid');
    const player = this.history.currentPlayer;
    const words = this.currentTurnWords ?? [];
    const points = this.currentTurnScore ?? 0;
    this.history.recordOutcome({ type: TurnOutcomeType.Save, player, words, points });
    this.startTurnForNextPlayer();
  }

  passCurrentTurn(): void {
    const player = this.history.currentPlayer;
    this.history.recordOutcome({ type: TurnOutcomeType.Pass, player });
    this.startTurnForNextPlayer();
  }

  resignCurrentTurn(): void {
    const loser = this.history.currentPlayer;
    const winner = this.history.nextPlayer;
    this.history.recordOutcome({ type: TurnOutcomeType.Lost, player: loser });
    this.history.recordOutcome({ type: TurnOutcomeType.Won, player: winner });
  }

  endGameByTileDepletion(players: ReadonlyArray<Player>): void {
    const scores = players.map(player => ({ player, score: this.getScoreFor(player) }));
    const maxScore = Math.max(...scores.map(s => s.score));
    const allTied = scores.every(s => s.score === maxScore);
    if (allTied) {
      for (const { player } of scores) this.history.recordOutcome({ type: TurnOutcomeType.Tied, player });
    } else {
      for (const { player, score } of scores) {
        this.history.recordOutcome({ type: score === maxScore ? TurnOutcomeType.Won : TurnOutcomeType.Lost, player });
      }
    }
  }

  private startTurnForNextPlayer(): void {
    this.history.createNewTurnFor(this.history.nextPlayer);
  }
}
