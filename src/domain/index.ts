import { Event } from '@/domain/enums.ts';
import Board from '@/domain/models/Board.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import Inventory from '@/domain/models/Inventory.ts';
import MatchTracker from '@/domain/models/MatchTracker.ts';
import TurnTracker from '@/domain/models/TurnTracker.ts';
import CurrentTurnValidator, { ValidatorContext } from '@/domain/services/CurrentTurnValidator.ts';
import TurnGenerator, { GeneratorContext, GeneratorResult } from '@/domain/services/TurnGenerator.ts';
import {
  GameCell,
  GameBoardView,
  GameTile,
  GamePlayer,
  GameTurnResolutionType,
  GameInventoryView,
  GameTurnView,
  GameMatchView,
} from '@/domain/types.ts';
import { IdGenerator } from '@/shared/ports.ts';

export default class Game {
  private readonly events = new Events();

  private constructor(
    private readonly board: Board,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly matchTracker: MatchTracker,
    private readonly turnTracker: TurnTracker,
  ) {}

  static create(dictionary: Dictionary, idGenerator: IdGenerator): Game {
    const board = Board.create();
    const players = Object.values(GamePlayer);
    const inventory = Inventory.create(players, idGenerator);
    const matchTracker = MatchTracker.create(players);
    const turnTracker = TurnTracker.create(idGenerator);
    const game = new Game(board, dictionary, inventory, matchTracker, turnTracker);
    game.startTurnForNextPlayer();
    return game;
  }

  get boardView(): Readonly<GameBoardView> {
    return this.board;
  }

  get inventoryView(): Readonly<GameInventoryView> {
    return this.inventory;
  }

  get turnView(): Readonly<GameTurnView> {
    return this.turnTracker;
  }

  get matchView(): Readonly<GameMatchView> {
    return this.matchTracker;
  }

  placeTile(input: { cell: GameCell; tile: GameTile }): void {
    this.matchTracker.ensureMutability();
    this.board.placeTile(input.cell, input.tile);
    this.turnTracker.placeTileInCurrentTurn(input.tile);
    this.events.record(Event.TilePlaced);
  }

  undoPlaceTile(input: { tile: GameTile }): void {
    this.matchTracker.ensureMutability();
    this.turnTracker.undoPlaceTileInCurrentTurn(input);
    this.board.undoPlaceTile(input.tile);
    this.events.record(Event.TileUndoPlaced);
  }

  clearTiles(): void {
    this.matchTracker.ensureMutability();
    for (const tile of this.turnTracker.currentTurnTiles) this.board.undoPlaceTile(tile);
    this.turnTracker.resetCurrentTurn();
  }

  validateTurn(): void {
    const result = CurrentTurnValidator.execute({
      board: this.board,
      dictionary: this.dictionary,
      inventory: this.inventory,
      turnTracker: this.turnTracker,
    } as ValidatorContext);
    this.turnTracker.setCurrentTurnValidation(result);
  }

  saveTurn(): { words: ReadonlyArray<string> } {
    this.matchTracker.ensureMutability();
    if (!this.turnView.currentTurnIsValid) throw new Error('Turn is not valid');
    const { currentPlayer: player, currentTurnTiles: tiles, currentTurnWords: words } = this.turnView;
    if (!words) throw new Error('Current turn words do not exist');
    this.turnTracker.recordCurrentTurnResolution(GameTurnResolutionType.Save);
    tiles.forEach(tile => this.inventory.discardTile({ player, tile }));
    this.inventory.replenishTilesFor(player);
    this.startTurnForNextPlayer();
    this.events.record(player === GamePlayer.User ? Event.UserTurnSaved : Event.OpponentTurnSaved);
    return { words };
  }

  passTurn(): void {
    const { currentPlayer: player } = this.turnView;
    this.matchTracker.ensureMutability();
    this.turnTracker.recordCurrentTurnResolution(GameTurnResolutionType.Pass);
    this.startTurnForNextPlayer();
    this.events.record(player === GamePlayer.User ? Event.UserTurnPassed : Event.OpponentTurnPassed);
  }

  async *generateTurnFor(player: GamePlayer, yieldControl: () => Promise<void>): AsyncGenerator<GeneratorResult> {
    yield* TurnGenerator.execute(
      {
        board: Board.clone(this.board),
        dictionary: this.dictionary,
        inventory: this.inventory,
        turnTracker: this.turnTracker,
        yieldControl,
      } as GeneratorContext,
      player,
    );
  }

  startTurnForNextPlayer(): void {
    this.turnTracker.createNewTurnFor(this.turnTracker.nextPlayer);
  }

  endMatchByScore(): void {
    const { leaderByScore, loserByScore } = this.turnTracker;
    if (leaderByScore === null || loserByScore === null) {
      this.tieMatch();
      this.events.record(Event.MatchTied);
      return;
    }
    this.completeMatch(leaderByScore, loserByScore);
    this.events.record(leaderByScore === GamePlayer.User ? Event.MatchWon : Event.MatchLost);
  }

  completeMatch(winner: GamePlayer, loser: GamePlayer): void {
    this.matchTracker.recordCompletion(winner, loser);
  }

  tieMatch(): void {
    this.matchTracker.recordTie(this.turnView.currentPlayer, this.turnView.nextPlayer);
  }

  resignMatch(): void {
    const { currentPlayer, nextPlayer } = this.turnView;
    this.matchTracker.recordCompletion(nextPlayer, currentPlayer);
    this.events.record(currentPlayer === GamePlayer.User ? Event.MatchLost : Event.MatchWon);
  }

  clearAllEvents(): Array<Event> {
    return this.events.clearAll();
  }
}

class Events {
  private readonly events: Array<Event> = [];

  record(event: Event): void {
    this.events.push(event);
  }

  clearAll(): Array<Event> {
    const copy = [...this.events];
    this.events.length = 0;
    return copy;
  }
}
