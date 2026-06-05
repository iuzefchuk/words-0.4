import { GameEventType, GamePlayer } from '@/app/types/index.ts';
import ShuffleService from '@/domain/services/ShuffleService.ts';
import type { AppSchedulerGateway, AppTurnGeneratorGateway } from '@/app/types/gateways.ts';
import type {
  AppTurnResponse,
  GameCell,
  GameEvent,
  GameMatchDifficulty,
  GameMatchSettings,
  GameMatchType,
  GameTile,
} from '@/app/types/index.ts';
import type { AppEventsRepository, AppRepositories, AppSettingsRepository } from '@/app/types/repositories.ts';
import type Game from '@/domain/Game.ts';

export default class AppCommands {
  private static readonly OPPONENT_RESPONSE_MIN_TIME_MS = 2_000;

  private get eventsRepo(): AppEventsRepository {
    return this.repositories.events;
  }

  private get settingsRepo(): AppSettingsRepository {
    return this.repositories.settings;
  }

  constructor(
    private readonly game: Game,
    private readonly scheduler: AppSchedulerGateway,
    private readonly turnGenerator: AppTurnGeneratorGateway,
    private readonly repositories: AppRepositories,
  ) {}

  changeMatchDifficulty(matchDifficulty: GameMatchDifficulty): void {
    this.game.changeMatchDifficulty(matchDifficulty);
    this.persistSettings({ difficulty: matchDifficulty });
  }

  changeMatchType(matchType: GameMatchType): void {
    this.game.changeMatchType(matchType);
    this.persistSettings({ type: matchType });
  }

  clearTiles(): void {
    this.game.clearTiles();
    this.persistEvents();
  }

  passTurn(): { opponentTurn: Promise<AppTurnResponse> | undefined } {
    this.clearTiles();
    this.game.passTurnForCurrentPlayer();
    if (this.game.matchView.isFinished) {
      this.clearEventsPersistence();
      return { opponentTurn: undefined };
    }
    this.persistEvents();
    return {
      opponentTurn: this.game.turnsView.currentPlayer === GamePlayer.Opponent ? this.createOpponentTurn() : undefined,
    };
  }

  placeTile({ cell, tile }: { cell: GameCell; tile: GameTile }): void {
    this.game.placeTile({ cell, tile });
    this.game.invalidateTurnForCurrentPlayer();
  }

  resignMatch(): void {
    this.clearTiles();
    this.game.resignMatchForCurrentPlayer();
    this.clearEventsPersistence();
  }

  restartGame(): void {
    this.game.restart();
    this.clearEventsPersistence();
  }

  saveTurn(): { opponentTurn: Promise<AppTurnResponse> | undefined; userResponse: AppTurnResponse } {
    const userResponse = this.saveTurnForCurrentPlayer();
    if (!userResponse.ok) {
      return { opponentTurn: undefined, userResponse };
    }
    if (this.game.matchView.isFinished) {
      this.clearEventsPersistence();
      return { opponentTurn: undefined, userResponse };
    }
    this.persistEvents();
    return {
      opponentTurn: this.game.turnsView.currentPlayer === GamePlayer.Opponent ? this.createOpponentTurn() : undefined,
      userResponse,
    };
  }

  shuffleUserTiles(tiles: Array<GameTile>): void {
    ShuffleService.shuffle({ array: tiles });
  }

  undoPlaceTile(tile: GameTile): void {
    this.game.undoPlaceTile({ tile });
    this.game.invalidateTurnForCurrentPlayer();
  }

  validateTurn(): void {
    this.game.validateTurn();
    this.persistEvents();
  }

  private clearEventsPersistence(): void {
    void this.eventsRepo.delete();
  }

  private async createOpponentEvent(): Promise<GameEvent> {
    const bestResult = await this.turnGenerator.generateBestResult({
      attemptsLimit: this.game.turnGenerationAttempts,
      context: this.game.createTurnGenerationContext(),
      player: GamePlayer.Opponent,
    });
    if (bestResult === null) {
      this.game.passTurnForCurrentPlayer();
      if (this.game.matchView.isFinished) {
        return { type: GameEventType.MatchFinished, winner: GamePlayer.User };
      }
      return { player: GamePlayer.Opponent, type: GameEventType.TurnPassed };
    }
    const { score, words } = this.game.applyGeneratedTurn(bestResult);
    return { player: GamePlayer.Opponent, score, type: GameEventType.TurnSaved, words };
  }

  private async createOpponentTurn(): Promise<AppTurnResponse> {
    const event = await this.scheduler.padTo(AppCommands.OPPONENT_RESPONSE_MIN_TIME_MS, () => this.createOpponentEvent());
    const response = this.getOpponentResponseFor(event);
    if (this.game.matchView.isFinished) {
      this.clearEventsPersistence();
    } else {
      this.persistEvents();
    }
    return response;
  }

  private getOpponentResponseFor(event: GameEvent): AppTurnResponse {
    switch (event.type) {
      case GameEventType.MatchFinished:
      case GameEventType.TurnPassed:
        return { ok: true, value: { words: [] } };
      case GameEventType.TurnSaved:
        return { ok: true, value: { words: event.words } };
      case GameEventType.MatchDifficultyChanged:
      case GameEventType.MatchStarted:
      case GameEventType.MatchTypeChanged:
      case GameEventType.TilePlaced:
      case GameEventType.TileUndoPlaced:
      case GameEventType.TurnValidationSet:
        throw new ReferenceError(`unexpected opponent event type "${event.type}"`);
    }
  }

  private persistEvents(): void {
    void this.eventsRepo.save(this.game.eventsLogView);
  }

  private persistSettings(settings: Partial<GameMatchSettings>): void {
    this.settingsRepo.save(settings);
  }

  private saveTurnForCurrentPlayer(): AppTurnResponse {
    const { currentTurnError } = this.game.turnsView;
    if (currentTurnError !== undefined) return { error: currentTurnError, ok: false };
    const { words } = this.game.saveTurnForCurrentPlayer();
    return { ok: true, value: { words } };
  }
}
