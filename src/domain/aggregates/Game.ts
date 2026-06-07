import Board from '@/domain/entities/Board.ts';
import Inventory from '@/domain/entities/Inventory.ts';
import Match from '@/domain/entities/Match.ts';
import Timeline from '@/domain/events/Timeline.ts';
import GenerationDifficultyPolicy from '@/domain/policies/GenerationDifficultyPolicy.ts';
import MatchTerminationPolicy from '@/domain/policies/MatchTerminationPolicy.ts';
import WinnerDerivationPolicy from '@/domain/policies/WinnerDerivationPolicy.ts';
import ShuffleService from '@/domain/services/ShuffleService.ts';
import TurnGenerationService from '@/domain/services/TurnGenerationService.ts';
import TurnValidationService from '@/domain/services/TurnValidationService.ts';
import {
  BoardType,
  MatchDifficulty,
  MatchPlayer,
  MatchType,
  TimelineEventType,
  TurnValidationStatus,
} from '@/domain/value-objects/enums.ts';
import type {
  BoardCell,
  BoardProjection,
  Dictionary,
  DictionaryGraph,
  Gateways,
  InventoryProjection,
  InventoryTile,
  MatchProjection,
  MatchSettings,
  TimelineEvent,
  TurnGenerationContext,
  TurnGenerationResult,
  TurnValidationResult,
} from '@/domain/value-objects/types.ts';

type GameInitialState = { board: Board; inventory: Inventory; match: Match };

type MatchStartedEvent = Extract<TimelineEvent, { type: TimelineEventType.MatchStarted }>;

export default class Game {
  private static readonly DEFAULT_SETTINGS: MatchSettings = {
    difficulty: MatchDifficulty.Low,
    type: MatchType.Classic,
  };

  get boardView(): BoardProjection {
    return this.board;
  }

  get eventsView(): ReadonlyArray<TimelineEvent> {
    return this.events.view;
  }

  get generationAttemptsLimit(): number {
    return GenerationDifficultyPolicy.attemptsFor(this.match.difficulty);
  }

  get inventoryView(): InventoryProjection {
    return this.inventory;
  }

  get matchView(): MatchProjection {
    return this.match;
  }

  private board!: Board;

  private inventory!: Inventory;

  private match!: Match;

  private constructor(
    private readonly events: Timeline,
    private readonly gateways: Gateways,
    initialState: GameInitialState,
  ) {
    this.initialize(initialState);
  }

  static create(gateways: Gateways, settings: null | Partial<MatchSettings>): Game {
    const event = Game.createInitialEvent(gateways, settings);
    return new Game(Timeline.create([event]), gateways, Game.createInitialState(event.seed, event.settings, gateways));
  }

  static createFromEvents(initialEvents: ReadonlyArray<TimelineEvent>, gateways: Gateways): Game {
    if (initialEvents[0] === undefined) throw new Error('cannot create game from empty events');
    const first = initialEvents[0];
    if (first.type !== TimelineEventType.MatchStarted)
      throw new Error(`expected first event to be MatchStarted, got ${first.type}`);
    const game = new Game(
      Timeline.create([...initialEvents]),
      gateways,
      Game.createInitialState(first.seed, first.settings, gateways),
    );
    for (let idx = 1; idx < initialEvents.length; idx++) {
      const event = initialEvents[idx];
      if (event === undefined) throw new ReferenceError(`expected event at index ${String(idx)}, got undefined`);
      game.replayEvent(event);
    }
    return game;
  }

  private static createInitialEvent(gateways: Gateways, settings: null | Partial<MatchSettings>): MatchStartedEvent {
    return {
      seed: gateways.randomizer.createNewSeed(),
      settings: Game.resolveSettings(settings),
      type: TimelineEventType.MatchStarted,
    };
  }

  private static createInitialState(seed: number, settings: MatchSettings, gateways: Gateways): GameInitialState {
    const players = Object.values(MatchPlayer);
    const randomizerFunction = gateways.randomizer.createFunctionFromSeed(seed);
    return {
      board: Board.create(Game.mapMatchTypeToBoardType(settings.type), randomizerFunction),
      inventory: Inventory.create(players, randomizerFunction),
      match: Match.create(players, settings, gateways.identifier),
    };
  }

  private static mapMatchTypeToBoardType(matchType: MatchType): BoardType {
    return {
      [MatchType.Classic]: BoardType.Preset,
      [MatchType.Random]: BoardType.Random,
    }[matchType];
  }

  private static resolveSettings(settings: null | Partial<MatchSettings>): MatchSettings {
    return {
      difficulty: settings?.difficulty ?? Game.DEFAULT_SETTINGS.difficulty,
      type: settings?.type ?? Game.DEFAULT_SETTINGS.type,
    };
  }

  applyGeneratedTurn(result: TurnGenerationResult): { score: number; words: ReadonlyArray<string> } {
    this.ensureMatchMutability();
    for (let idx = 0; idx < result.tiles.length; idx++) {
      const cell = result.cells[idx];
      if (cell === undefined) throw new ReferenceError(`expected cell at index ${String(idx)}, got undefined`);
      const tile = result.tiles[idx];
      if (tile === undefined) throw new ReferenceError(`expected tile at index ${String(idx)}, got undefined`);
      this.recordEvent({ cell, tile, type: TimelineEventType.TilePlaced });
    }
    this.recordTurnValidation(result.validationResult);
    const { score } = result.validationResult;
    const { words } = this.saveTurnForCurrentPlayer();
    return { score, words };
  }

  clearUserTiles(): void {
    this.ensureMatchMutability();
    const tiles = [...this.match.currentTurnTiles];
    for (const tile of tiles) {
      const cell = this.board.findCellByTile(tile);
      if (cell === undefined) throw new Error(`tile ${String(tile)} is not on the board`);
      this.recordEvent({ cell, tile, type: TimelineEventType.TileUndoPlaced });
    }
    this.recordEvent({ result: { status: TurnValidationStatus.Unvalidated }, type: TimelineEventType.TurnValidationSet });
  }

  createTurnGenerationContext(dictionary: DictionaryGraph): TurnGenerationContext {
    return TurnGenerationService.createContext(this.board, dictionary, this.inventory, this.match);
  }

  finishMatchByScore(): void {
    this.ensureMatchMutability();
    const winner = WinnerDerivationPolicy.byScore(this.match);
    this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
  }

  invalidateTurnForCurrentPlayer(): void {
    this.recordTurnValidation({ status: TurnValidationStatus.Unvalidated });
  }

  passTurnForCurrentPlayer(): void {
    this.ensureMatchMutability();
    const player = this.matchView.currentPlayer;
    if (this.match.willPlayerPassBeResign(player)) {
      const winner = WinnerDerivationPolicy.onResignation(player);
      this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
      return;
    }
    this.recordEvent({ player, type: TimelineEventType.TurnPassed });
  }

  placeTile(input: { cell: BoardCell; tile: InventoryTile }): void {
    this.ensureMatchMutability();
    this.recordEvent({ cell: input.cell, tile: input.tile, type: TimelineEventType.TilePlaced });
  }

  replayEvent(event: TimelineEvent): void {
    this.applyEventToState(event);
  }

  resignMatchForCurrentPlayer(): void {
    this.ensureMatchMutability();
    const winner = WinnerDerivationPolicy.onResignation(this.matchView.currentPlayer);
    this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
  }

  restart(): void {
    const seed = this.gateways.randomizer.createNewSeed();
    const settings: MatchSettings = { difficulty: this.match.difficulty, type: this.match.type };
    const event: TimelineEvent = { seed, settings, type: TimelineEventType.MatchStarted };
    this.events.reset(event);
    this.initialize(Game.createInitialState(seed, settings, this.gateways));
  }

  saveTurnForCurrentPlayer(): { words: ReadonlyArray<string> } {
    this.ensureMatchMutability();
    if (!this.matchView.currentTurnIsValid) throw new Error('cannot save invalid turn');
    const { currentPlayer: player, currentTurnScore: score, currentTurnWords: words } = this.matchView;
    if (words === undefined) throw new ReferenceError('expected current turn words, got undefined');
    if (score === undefined) throw new ReferenceError('expected current turn score, got undefined');
    this.recordEvent({ player, score, type: TimelineEventType.TurnSaved, words });
    const decision = MatchTerminationPolicy.afterTurnSaved({
      currentPlayer: player,
      inventory: this.inventory,
      match: this.match,
    });
    if (decision.terminate) this.recordEvent({ type: TimelineEventType.MatchFinished, winner: decision.winner });
    return { words };
  }

  setMatchDifficulty(matchDifficulty: MatchDifficulty): void {
    // TODO dont reset inventory
    this.ensureMatchMutability();
    this.ensureSettingsMutability();
    this.recordEvent({ difficulty: matchDifficulty, type: TimelineEventType.MatchDifficultyChanged });
  }

  setMatchType(matchType: MatchType): void {
    this.ensureMatchMutability();
    this.ensureSettingsMutability();
    const seed = this.gateways.randomizer.createNewSeed();
    this.recordEvent({ matchType, seed, type: TimelineEventType.MatchTypeChanged });
  }

  shuffleTiles(tiles: Array<InventoryTile>): void {
    ShuffleService.shuffle({ array: tiles });
  }

  undoPlaceTile(input: { tile: InventoryTile }): void {
    this.ensureMatchMutability();
    const cell = this.board.findCellByTile(input.tile);
    if (cell === undefined) throw new Error(`tile ${input.tile} is not on the board`);
    this.recordEvent({ cell, tile: input.tile, type: TimelineEventType.TileUndoPlaced });
  }

  validateTurn(dictionary: Dictionary): void {
    this.ensureMatchMutability();
    const result = TurnValidationService.execute({
      board: this.board,
      dictionary,
      inventory: this.inventory,
      match: this.match,
    });
    this.recordTurnValidation(result);
  }

  private applyEventToState(event: TimelineEvent): void {
    switch (event.type) {
      case TimelineEventType.MatchDifficultyChanged:
        this.match.applyDifficultyChange(event.difficulty);
        break;
      case TimelineEventType.MatchFinished:
        this.applyMatchFinished(event.winner);
        break;
      case TimelineEventType.MatchStarted:
        throw new Error('cannot apply MatchStarted after game creation');
      case TimelineEventType.TilePlaced:
        this.board.placeTile(event.cell, event.tile);
        this.match.addPlacedTile(event.tile);
        break;
      case TimelineEventType.MatchTypeChanged:
        this.initialize(
          Game.createInitialState(event.seed, { difficulty: this.match.difficulty, type: event.matchType }, this.gateways),
        );
        break;
      case TimelineEventType.TileUndoPlaced:
        this.match.removePlacedTile(event.tile);
        this.board.undoPlaceTile(event.tile);
        break;
      case TimelineEventType.TurnPassed:
        this.match.passCurrentTurn(event.player);
        this.match.startTurnFor(this.match.nextPlayer);
        break;
      case TimelineEventType.TurnSaved:
        this.applyTurnSaved(event.player, event.score);
        break;
      case TimelineEventType.TurnValidationSet:
        this.match.recordValidationResult(event.result);
        break;
      default: {
        throw new Error(`unhandled event: ${JSON.stringify(event)}`);
      }
    }
  }

  private applyMatchFinished(winner: MatchPlayer | null): void {
    if (winner === null) {
      this.match.recordTie(this.matchView.currentPlayer, this.matchView.nextPlayer);
      return;
    }
    const loser = WinnerDerivationPolicy.onResignation(winner);
    this.match.recordCompletion(winner, loser);
  }

  private applyTurnSaved(player: MatchPlayer, score: number): void {
    const tiles = this.match.currentTurnTiles;
    tiles.forEach(tile => {
      this.inventory.discardTile({ player, tile });
    });
    this.inventory.replenishTilesFor(player);
    this.match.saveCurrentTurn(player);
    this.match.incrementScore(player, score);
    this.match.startTurnFor(this.match.nextPlayer);
  }

  private ensureMatchMutability(): void {
    if (this.match.isFinished) throw new Error('cannot mutate finished match');
  }

  private ensureSettingsMutability(): void {
    if (this.match.historyHasPriorTurns) throw new Error('cannot change settings after first turn');
  }

  private initialize(params: GameInitialState): void {
    this.board = params.board;
    this.inventory = params.inventory;
    this.match = params.match;
    this.match.startTurnFor(this.match.nextPlayer);
  }

  private recordEvent(event: TimelineEvent): void {
    this.applyEventToState(event);
    this.events.record(event);
  }

  private recordTurnValidation(result: TurnValidationResult): void {
    this.ensureMatchMutability();
    this.recordEvent({ result, type: TimelineEventType.TurnValidationSet });
  }
}
