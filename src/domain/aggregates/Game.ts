import Match from '@/domain/entities/Match.ts';
import { TimelineEventType } from '@/domain/events/enums.ts';
import Timeline from '@/domain/events/Timeline.ts';
import GenerationDifficultyPolicy from '@/domain/policies/GenerationDifficultyPolicy.ts';
import MatchTerminationPolicy from '@/domain/policies/MatchTerminationPolicy.ts';
import WinnerDerivationPolicy from '@/domain/policies/WinnerDerivationPolicy.ts';
import { MatchDifficulty, MatchPlayer, MatchType, TurnValidity } from '@/domain/value-objects/enums.ts';
import type { TimelineEvent, TimelineProjection } from '@/domain/events/types.ts';
import type {
  Dictionary,
  DictionaryGraph,
  Gateways,
  InventoryTile,
  MatchProjection,
  MatchSettings,
  PlayfieldCell,
  TurnEvaluation,
  TurnGenerationContext,
  TurnGenerationResult,
} from '@/domain/value-objects/types.ts';

export default class Game {
  private static readonly DEFAULT_SETTINGS: MatchSettings = {
    difficulty: MatchDifficulty.Low,
    type: MatchType.Classic,
  };

  get generationAttemptsLimit(): number {
    return GenerationDifficultyPolicy.attemptsFor(this.match.settings.difficulty);
  }

  get matchProjection(): MatchProjection {
    return this.match;
  }

  get timelineProjection(): TimelineProjection {
    return this.timeline;
  }

  private constructor(
    private readonly players: MatchPlayer[],
    private timeline: Timeline,
    private readonly gateways: Gateways,
    private match: Match,
  ) {
    this.match.startTurnFor(this.match.nextPlayer);
  }

  static create(gateways: Gateways, settings: null | Partial<MatchSettings>): Game {
    const resolvedSettings = Game.resolveSettings(settings);
    const seed = gateways.randomizer.createNewSeed();
    const timeline = Timeline.create();
    const players = Object.values(MatchPlayer);
    timeline.record({ seed, settings: resolvedSettings, type: TimelineEventType.MatchStarted });
    return new Game(players, timeline, gateways, Game.createMatch(seed, resolvedSettings, players, gateways));
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
    const players = Object.values(MatchPlayer);
    const game = new Game(players, timeline, gateways, Game.createMatch(first.seed, first.settings, players, gateways));
    for (let idx = 1; idx < initialEvents.length; idx++) {
      const event = initialEvents[idx];
      if (event === undefined) throw new ReferenceError(`expected event at index ${String(idx)}, got undefined`);
      game.applyEventToState(event);
    }
    return game;
  }

  private static createMatch(
    seed: number,
    settings: MatchSettings,
    players: ReadonlyArray<MatchPlayer>,
    gateways: Gateways,
  ): Match {
    const randomizerFunction = gateways.randomizer.createFunctionFromSeed(seed);
    return Match.create(players, settings, gateways.identifier, randomizerFunction);
  }

  private static resolveSettings(settings: null | Partial<MatchSettings>): MatchSettings {
    return {
      difficulty: settings?.difficulty ?? Game.DEFAULT_SETTINGS.difficulty,
      type: settings?.type ?? Game.DEFAULT_SETTINGS.type,
    };
  }

  applyGeneratedTurn(result: TurnGenerationResult): { score: number; words: ReadonlyArray<string> } {
    for (const { cell, tile } of result.placement) {
      this.match.placeTile(cell, tile);
    }
    this.recordTurnValidation(result.evaluation);
    const { score } = result.evaluation.computation;
    const { words } = this.saveTurnForCurrentPlayer();
    return { score, words };
  }

  clearUserTiles(): void {
    this.match.resetCurrentTurn();
    this.recordEvent({ type: TimelineEventType.TurnValidationSet, value: { status: TurnValidity.Unknown } });
  }

  createTurnGenerationContext(dictionary: DictionaryGraph): TurnGenerationContext {
    return this.match.createTurnGenerationContext(dictionary);
  }

  finishMatchByScore(): void {
    const winner = WinnerDerivationPolicy.byScore(this.match);
    this.recordEvent({ type: TimelineEventType.MatchFinished, winner });
  }

  invalidateTurnForCurrentPlayer(): void {
    this.recordTurnValidation({ status: TurnValidity.Unknown });
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
    this.match.placeTile(input.cell, input.tile);
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
    const placement = this.match.resolvePlacement(this.match.currentTurnTiles);
    this.recordEvent({ placement, player, score, type: TimelineEventType.TurnSaved, words });
    const decision = MatchTerminationPolicy.afterTurnSaved({
      currentPlayer: player,
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
    this.match.shuffleTilesFor(player);
  }

  undoPlaceTile(input: { tile: InventoryTile }): void {
    this.match.undoPlaceTile(input.tile);
  }

  validateTurn(dictionary: Dictionary): void {
    const result = this.match.evaluateTurn(dictionary);
    this.recordTurnValidation(result);
  }

  private applyEventToState(event: TimelineEvent): void {
    switch (event.type) {
      case TimelineEventType.MatchStarted:
        throw new Error(`${TimelineEventType.MatchStarted} is not replayable`);
      case TimelineEventType.MatchFinished:
        this.applyMatchFinished(event.winner);
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
    for (const { cell, tile } of event.placement) {
      if (!this.match.isTilePlaced(tile)) this.match.placeTile(cell, tile);
    }
    for (const { tile } of event.placement) {
      this.match.discardTile(event.player, tile);
    }
    this.match.replenishTilesFor(event.player);
    this.match.saveCurrentTurn(event.player);
    this.match.startTurnFor(this.match.nextPlayer);
  }

  private recordEvent(event: TimelineEvent): void {
    this.timeline.record(event);
    this.applyEventToState(event);
  }

  private recordTurnValidation(result: TurnEvaluation): void {
    this.recordEvent({ type: TimelineEventType.TurnValidationSet, value: result });
  }

  private restartWithSettings(settings: MatchSettings): void {
    const seed = this.gateways.randomizer.createNewSeed();
    this.timeline = Timeline.create();
    this.timeline.record({ seed, settings, type: TimelineEventType.MatchStarted });
    this.match = Game.createMatch(seed, settings, this.players, this.gateways);
    this.match.startTurnFor(this.match.nextPlayer);
  }
}
