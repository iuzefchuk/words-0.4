import { DomainMatchPlayer } from '@/app/enums/index.ts';
import type { AppGateways } from '@/app/types/gateways.ts';
import type { DomainMatchDifficulty, DomainMatchType } from '@/app/enums/index.ts';
import type {
  AppTurnResponse,
  DomainBoardCell,
  DomainDictionary,
  DomainInventoryTile,
  DomainMatchSettings,
  DomainTurnGenerationContext,
} from '@/app/types/index.ts';
import type { AppEventsRepository, AppRepositories, AppSettingsRepository } from '@/app/types/repositories.ts';
import type { default as DomainGame } from '@/domain/aggregates/Game.ts';

export default class AppCommands {
  private static readonly OPPONENT_RESPONSE_MIN_TIME_MS = 2_000;

  private get eventsRepo(): AppEventsRepository {
    return this.repositories.events;
  }

  private get settingsRepo(): AppSettingsRepository {
    return this.repositories.settings;
  }

  constructor(
    private readonly game: DomainGame,
    private readonly dictionary: DomainDictionary,
    private readonly gateways: AppGateways,
    private readonly repositories: AppRepositories,
  ) {}

  changeMatchDifficulty(matchDifficulty: DomainMatchDifficulty): void {
    this.game.setMatchDifficulty(matchDifficulty);
    this.persistSettings({ difficulty: matchDifficulty });
  }

  changeMatchType(matchType: DomainMatchType): void {
    this.game.setMatchType(matchType);
    this.persistSettings({ type: matchType });
  }

  clearUserTiles(): void {
    this.game.clearUserTiles();
    this.persistEvents();
  }

  passTurn(): { opponentTurn: Promise<AppTurnResponse> | undefined } {
    this.clearUserTiles();
    this.game.passTurnForCurrentPlayer();
    if (this.game.matchView.isFinished) {
      this.clearEventsPersistence();
      return { opponentTurn: undefined };
    }
    this.persistEvents();
    return {
      opponentTurn: this.game.matchView.currentPlayer === DomainMatchPlayer.Opponent ? this.createOpponentTurn() : undefined,
    };
  }

  placeTile({ cell, tile }: { cell: DomainBoardCell; tile: DomainInventoryTile }): void {
    this.game.placeTile({ cell, tile });
    this.game.invalidateTurnForCurrentPlayer();
  }

  resignMatch(): void {
    this.clearUserTiles();
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
      opponentTurn: this.game.matchView.currentPlayer === DomainMatchPlayer.Opponent ? this.createOpponentTurn() : undefined,
      userResponse,
    };
  }

  shuffleUserTiles(tiles: Array<DomainInventoryTile>): void {
    this.game.shuffleTiles(tiles);
  }

  undoPlaceTile(tile: DomainInventoryTile): void {
    this.game.undoPlaceTile({ tile });
    this.game.invalidateTurnForCurrentPlayer();
  }

  validateTurn(): void {
    this.game.validateTurn(this.dictionary);
    this.persistEvents();
  }

  private clearEventsPersistence(): void {
    void this.eventsRepo.delete();
  }

  private async createOpponentTurn(): Promise<AppTurnResponse> {
    const response = await this.gateways.scheduler.padTo(AppCommands.OPPONENT_RESPONSE_MIN_TIME_MS, () =>
      this.executeOpponentTurn(),
    );
    if (this.game.matchView.isFinished) {
      this.clearEventsPersistence();
    } else {
      this.persistEvents();
    }
    return response;
  }

  private createTurnGenerationContext(): DomainTurnGenerationContext {
    return this.game.createTurnGenerationContext(this.dictionary);
  }

  private async executeOpponentTurn(): Promise<AppTurnResponse> {
    const bestResult = await this.gateways.turnGenerator.generateBestResult({
      attemptsLimit: this.game.generationAttemptsLimit,
      context: this.createTurnGenerationContext(),
      player: DomainMatchPlayer.Opponent,
    });
    if (bestResult === null) {
      this.game.passTurnForCurrentPlayer();
      return { ok: true, value: { words: [] } };
    }
    const { words } = this.game.applyGeneratedTurn(bestResult);
    return { ok: true, value: { words } };
  }

  private persistEvents(): void {
    void this.eventsRepo.save(this.game.eventsView);
  }

  private persistSettings(settings: Partial<DomainMatchSettings>): void {
    this.settingsRepo.save(settings);
  }

  private saveTurnForCurrentPlayer(): AppTurnResponse {
    const { currentTurnError } = this.game.matchView;
    if (currentTurnError !== undefined) return { error: currentTurnError, ok: false };
    const { words } = this.game.saveTurnForCurrentPlayer();
    return { ok: true, value: { words } };
  }
}
