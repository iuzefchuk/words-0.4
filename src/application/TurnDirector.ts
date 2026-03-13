import { Player, PlayerAction } from '@/domain/player/types.ts';
import { TileId } from '@/domain/tiles/types.ts';
import { CellIndex } from '@/domain/board/types.ts';
import { Placement, ValidationResult } from '@/domain/turn/types.ts';
import { Board } from '@/domain/board/types.ts';
import TurnHistory from '@/domain/turn/History.ts';
import PlayerStatusTracker from '@/domain/player/PlayerStatusTracker.ts';

export default class TurnDirector {
  private constructor(
    private readonly board: Board,
    private readonly history: TurnHistory,
    private readonly statusTracker: PlayerStatusTracker,
  ) {}

  static create({ players, board }: { players: Array<Player>; board: Board }): TurnDirector {
    const history = TurnHistory.create();
    const statusTracker = PlayerStatusTracker.create(players);
    const director = new TurnDirector(board, history, statusTracker);
    director.startTurnForNextPlayer();
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

  get currentTurnScore(): number | undefined {
    return this.history.currentTurn.score;
  }

  get currentTurnIsValid(): boolean {
    return this.history.currentTurn.isValid;
  }

  get currentTurnPlacement(): Placement {
    return this.history.currentTurn.placement;
  }

  get previousTurnTileSequence(): ReadonlyArray<TileId> | undefined {
    return this.history.previousTurnTileSequence;
  }

  get historyIsEmpty(): boolean {
    return this.history.isEmpty;
  }

  getScoreFor(player: Player): number {
    return this.history.getScoreFor(player);
  }

  hasPlayerPassed(player: Player): boolean {
    return this.statusTracker.hasPlayerPassed(player);
  }

  placeTile({ cell, tile }: { cell: CellIndex; tile: TileId }): void {
    this.history.currentTurn.placeTile({ cell, tile });
    this.board.placeTile(cell, tile);
  }

  undoPlaceTile({ tile }: { tile: TileId }): void {
    this.history.currentTurn.undoPlaceTile({ tile });
    this.board.undoPlaceTile(tile);
  }

  setCurrentTurnValidation(result: ValidationResult): void {
    this.history.currentTurn.setValidation(result);
  }

  resetCurrentTurn(): void {
    for (const { tile } of this.history.currentTurn.placement) {
      this.board.undoPlaceTile(tile);
    }
    this.history.currentTurn.reset();
  }

  saveCurrentTurn(): void {
    if (!this.currentTurnIsValid) throw new Error('Turn is not valid');
    this.statusTracker.record(this.history.currentPlayer, PlayerAction.Saved);
    this.startTurnForNextPlayer();
  }

  passCurrentTurn(): void {
    this.statusTracker.record(this.history.currentPlayer, PlayerAction.Passed);
    this.startTurnForNextPlayer();
  }

  resignCurrentTurn(): void {
    const winner = this.history.nextPlayer;
    this.statusTracker.record(winner, PlayerAction.Won);
  }

  private startTurnForNextPlayer(): void {
    this.history.createNewTurnFor(this.history.nextPlayer);
  }
}
