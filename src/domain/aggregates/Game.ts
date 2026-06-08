import Inventory from '@/domain/entities/Inventory.ts';
import Match from '@/domain/entities/Match.ts';
import Playfield from '@/domain/entities/Playfield.ts';
import { TimelineEventType } from '@/domain/events/enums.ts';
import Timeline from '@/domain/events/Timeline.ts';
import GenerationDifficultyPolicy from '@/domain/policies/GenerationDifficultyPolicy.ts';
import MatchTerminationPolicy from '@/domain/policies/MatchTerminationPolicy.ts';
import WinnerDerivationPolicy from '@/domain/policies/WinnerDerivationPolicy.ts';
import TurnGenerationService from '@/domain/services/TurnGenerationService.ts';
import TurnValidationService from '@/domain/services/TurnValidationService.ts';
import { MatchDifficulty, MatchPlayer, MatchType, PlayfieldType, TurnValidationStatus } from '@/domain/value-objects/enums.ts';
import type { TimelineEvent, TimelineProjection } from '@/domain/events/types.ts';
import type {
  Dictionary,
  DictionaryGraph,
  Gateways,
  InventoryProjection,
  InventoryTile,
  MatchProjection,
  MatchSettings,
  PlayfieldCell,
  PlayfieldProjection,
  TurnGenerationContext,
  TurnGenerationResult,
  TurnValidationResult,
} from '@/domain/value-objects/types.ts';

type GameInitialState = { inventory: Inventory; match: Match; playfield: Playfield };

export default class Game {
  private static readonly DEFAULT_SETTINGS: MatchSettings = {
    difficulty: MatchDifficulty.Low,
    type: MatchType.Classic,
  };

  get generationAttemptsLimit(): number {
    return GenerationDifficultyPolicy.attemptsFor(this.match.settings.difficulty);
  }

  get inventoryProjection(): InventoryProjection {
    return this.inventory;
  }

  get matchProjection(): MatchProjection {
    return this.match;
  }

  get playfieldProjection(): PlayfieldProjection {
    return this.playfield;
  }

  get timelineProjection(): TimelineProjection {
    return this.timeline;
  }

  private inventory!: Inventory;

  private match!: Match;

  private playfield!: Playfield;

  private constructor(
    private timeline: Timeline,
    private readonly gateways: Gateways,
    initialState: GameInitialState,
  ) {
    this.initialize(initialState);
  }

  static create(gateways: Gateways, settings: null | Partial<MatchSettings>): Game {
    const resolvedSettings = Game.resolveSettings(settings);
    const seed = gateways.randomizer.createNewSeed();
    const timeline = Timeline.create();
    timeline.record({ seed, settings: resolvedSettings, type: TimelineEventType.MatchStarted });
    return new Game(timeline, gateways, Game.createInitialState(seed, resolvedSettings, gateways));
  }

  static createFromEvents(initialEvents: ReadonlyArray<TimelineEvent>, gateways: Gateways): Game {
    if (initialEvents.length === 0) throw new Error('cannot create game from empty events');
    const timeline = Timeline.create();
    for (const event of initialEvents) {
      timeline.record(event);
    }
    const first = initialEvents[0];
    if (first?.type !== TimelineEventType.MatchStarted) {
      throw new Error(`first event must be ${TimelineEventType.MatchStarted}, got ${String(first?.type)}`);
    }
    const game = new Game(timeline, gateways, Game.createInitialState(first.seed, first.settings, gateways));
    for (let idx = 1; idx < initialEvents.length; idx++) {
      const event = initialEvents[idx];
      if (event === undefined) throw new ReferenceError(`expected event at index ${String(idx)}, got undefined`);
      game.applyEventToState(event);
    }
    return game;
  }

  private static createInitialState(seed: number, settings: MatchSettings, gateways: Gateways): GameInitialState {
    const players = Object.values(MatchPlayer);
    const randomizerFunction = gateways.randomizer.createFunctionFromSeed(seed);
    return {
      inventory: Inventory.create(players, randomizerFunction),
      match: Match.create(players, settings, gateways.identifier),
      playfield: Playfield.create(Game.mapMatchTypeToPlayfieldType(settings.type), randomizerFunction),
    };
  }

  private static mapMatchTypeToPlayfieldType(matchType: MatchType): PlayfieldType {
    return {
      [MatchType.Classic]: PlayfieldType.Preset,
      [MatchType.Random]: PlayfieldType.Random,
    }[matchType];
  }

  private static resolveSettings(settings: null | Partial<MatchSettings>): MatchSettings {
    return {
      difficulty: settings?.difficulty ?? Game.DEFAULT_SETTINGS.difficulty,
      type: settings?.type ?? Game.DEFAULT_SETTINGS.type,
    };
  }

  applyGeneratedTurn(result: TurnGenerationResult): { score: number; words: ReadonlyArray<string> } {
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
    const tiles = [...this.match.currentTurnTiles];
    for (const tile of tiles) {
      const cell = this.playfield.findCellByTile(tile);
      if (cell === undefined) throw new Error(`tile ${String(tile)} is not on the playfield`);
      this.recordEvent({ cell, tile, type: TimelineEventType.TileUndoPlaced });
    }
    this.recordEvent({ type: TimelineEventType.TurnValidationSet, value: { status: TurnValidationStatus.Unvalidated } });
  }

  createTurnGenerationContext(dictionary: DictionaryGraph): TurnGenerationContext {
    return TurnGenerationService.createContext(this.playfield, dictionary, this.inventory, this.match);
  }

  finishMatchByScore(): void {
    const winner = WinnerDerivationPolicy.byScore(this.match);
    this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
  }

  invalidateTurnForCurrentPlayer(): void {
    this.recordTurnValidation({ status: TurnValidationStatus.Unvalidated });
  }

  passTurnForCurrentPlayer(): void {
    const player = this.matchProjection.currentPlayer;
    if (this.match.willPlayerPassBeResign(player)) {
      const winner = WinnerDerivationPolicy.getOppositePlayer(player);
      this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
      return;
    }
    this.recordEvent({ player, type: TimelineEventType.TurnPassed });
  }

  placeTile(input: { cell: PlayfieldCell; tile: InventoryTile }): void {
    this.recordEvent({ cell: input.cell, tile: input.tile, type: TimelineEventType.TilePlaced });
  }

  resignMatchForCurrentPlayer(): void {
    const winner = WinnerDerivationPolicy.getOppositePlayer(this.matchProjection.currentPlayer);
    this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
  }

  restart(): void {
    this.restartWithSettings({ ...this.match.settings });
  }

  saveTurnForCurrentPlayer(): { words: ReadonlyArray<string> } {
    if (!this.matchProjection.currentTurnIsValid) throw new Error('cannot save invalid turn');
    const { currentPlayer: player, currentTurnScore: score, currentTurnWords: words } = this.matchProjection;
    if (words === undefined) throw new ReferenceError('expected current turn words, got undefined');
    if (score === undefined) throw new ReferenceError('expected current turn score, got undefined');
    const tiles = [...this.match.currentTurnTiles];
    this.recordEvent({ player, score, tiles, type: TimelineEventType.TurnSaved, words });
    const decision = MatchTerminationPolicy.afterTurnSaved({
      currentPlayer: player,
      inventory: this.inventory,
      match: this.match,
    });
    if (decision.terminate) this.recordEvent({ type: TimelineEventType.MatchFinished, winner: decision.winner });
    return { words };
  }

  setMatchDifficulty(matchDifficulty: MatchDifficulty): void {
    this.restartWithSettings({ ...this.match.settings, difficulty: matchDifficulty });
  }

  setMatchType(matchType: MatchType): void {
    this.restartWithSettings({ ...this.match.settings, type: matchType });
  }

  shuffleTilesFor(player: MatchPlayer): void {
    this.inventory.shuffleTilesFor(player);
  }

  undoPlaceTile(input: { tile: InventoryTile }): void {
    const cell = this.playfield.findCellByTile(input.tile);
    if (cell === undefined) throw new Error(`tile ${input.tile} is not on the playfield`);
    this.recordEvent({ cell, tile: input.tile, type: TimelineEventType.TileUndoPlaced });
  }

  validateTurn(dictionary: Dictionary): void {
    const result = TurnValidationService.execute({
      dictionary,
      inventory: this.inventory,
      match: this.match,
      playfield: this.playfield,
    });
    this.recordTurnValidation(result);
  }

  private applyEventToState(event: TimelineEvent): void {
    switch (event.type) {
      case TimelineEventType.MatchStarted:
        throw new Error(`${TimelineEventType.MatchStarted} is not replayable`);
      case TimelineEventType.MatchFinished:
        this.applyMatchFinished(event.winner);
        break;
      case TimelineEventType.TilePlaced:
        this.playfield.placeTile(event.cell, event.tile);
        this.match.addPlacedTile(event.tile);
        break;
      case TimelineEventType.TileUndoPlaced:
        this.match.removePlacedTile(event.tile);
        this.playfield.undoPlaceTile(event.tile);
        break;
      case TimelineEventType.TurnPassed:
        this.match.passCurrentTurn(event.player);
        this.match.startTurnFor(this.match.nextPlayer);
        break;
      case TimelineEventType.TurnSaved:
        this.applyTurnSaved(event);
        break;
      case TimelineEventType.TurnValidationSet:
        this.match.recordValidationResult(event.value);
        break;
      default: {
        throw new Error(`unhandled event: ${JSON.stringify(event)}`);
      }
    }
  }

  private applyMatchFinished(winner: MatchPlayer | null): void {
    if (winner === null) {
      this.match.recordTie(this.matchProjection.currentPlayer, this.matchProjection.nextPlayer);
      return;
    }
    const loser = WinnerDerivationPolicy.getOppositePlayer(winner);
    this.match.recordCompletion(winner, loser);
  }

  private applyTurnSaved(event: Extract<TimelineEvent, { type: TimelineEventType.TurnSaved }>): void {
    for (const tile of event.tiles) {
      this.inventory.discardTile({ player: event.player, tile });
    }
    this.inventory.replenishTilesFor(event.player);
    this.match.saveCurrentTurn(event.player);
    this.match.incrementScore(event.player, event.score);
    this.match.startTurnFor(this.match.nextPlayer);
  }

  private initialize(params: GameInitialState): void {
    this.playfield = params.playfield;
    this.inventory = params.inventory;
    this.match = params.match;
    this.match.startTurnFor(this.match.nextPlayer);
  }

  private recordEvent(event: TimelineEvent): void {
    this.timeline.record(event);
    this.applyEventToState(event);
  }

  private recordTurnValidation(result: TurnValidationResult): void {
    this.recordEvent({ type: TimelineEventType.TurnValidationSet, value: result });
  }

  private restartWithSettings(settings: MatchSettings): void {
    const seed = this.gateways.randomizer.createNewSeed();
    this.timeline = Timeline.create();
    this.timeline.record({ seed, settings, type: TimelineEventType.MatchStarted });
    this.initialize(Game.createInitialState(seed, settings, this.gateways));
  }
}
