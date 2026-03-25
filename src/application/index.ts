import { AppConfig, AppState, AppTurnResponse, AppTurnResolution } from '@/application/types.ts';
import Game from '@/domain/index.ts';
import {
  GamePlayer,
  GameCell,
  GameTile,
  GameEvent,
  GameTurnResolutionType,
  GameTurnResolution,
} from '@/domain/types.ts';
import Infrastructure from '@/infrastructure/index.ts';
import { TIME } from '@/shared/constants.ts';
import { Clock, Scheduler } from '@/shared/ports.ts';

export default class Application {
  private static readonly OPPONENT_RESPONSE_MIN_TIME = TIME.ms_in_second * 2;

  private constructor(
    private readonly game: Game,
    private readonly clock: Clock,
    private readonly scheduler: Scheduler,
  ) {}

  static async create(): Promise<Application> {
    const { dictionary, idGenerator, clock, scheduler } = await Infrastructure.createAppDependencies();
    const game = Game.create(dictionary, idGenerator);
    return new Application(game, clock, scheduler);
  }

  get config(): AppConfig {
    return this.game.config;
  }

  get state(): AppState {
    return {
      tilesRemaining: this.game.state.unusedTilesCount,
      matchIsFinished: this.game.state.matchIsFinished,
      currentPlayerIsUser: this.game.state.currentPlayer === GamePlayer.User,
      currentTurnScore: this.game.state.currentTurnScore,
      currentTurnIsValid: this.game.state.currentTurnIsValid,
      userScore: this.game.getScoreFor(GamePlayer.User),
      opponentScore: this.game.getScoreFor(GamePlayer.Opponent),
      userPassWillBeResign: this.game.willPlayerPassBeResign(GamePlayer.User),
      userTiles: this.game.getTilesFor(GamePlayer.User),
      turnResolutionHistory: this.game.state.turnResolutionHistory.map(r => this.simplifyTurnResolution(r)),
      matchResult: this.game.getMatchResultFor(GamePlayer.User),
    };
  }

  isCellInCenterOfLayout(cell: GameCell): boolean {
    return this.game.isCellCenter(cell);
  }

  getCellBonus(cell: GameCell): string | null {
    return this.game.getBonusForCell(cell);
  }

  findTileByCell(cell: GameCell): GameTile | undefined {
    return this.game.findTileByCell(cell);
  }

  findCellByTile(tile: GameTile): GameCell | undefined {
    return this.game.findCellByTile(tile);
  }

  isTilePlaced(tile: GameTile): boolean {
    return this.game.isTilePlaced(tile);
  }

  getCellRowIndex(cell: GameCell): number {
    return this.game.getRowIndex(cell);
  }

  getCellColumnIndex(cell: GameCell): number {
    return this.game.getColumnIndex(cell);
  }

  areTilesSame(firstTile: GameTile, secondTile: GameTile): boolean {
    return this.game.areTilesEqual(firstTile, secondTile);
  }

  getTileLetter(tile: GameTile): string {
    return this.game.getTileLetter(tile);
  }

  isCellTopRightInTurn(cell: GameCell): boolean {
    const { currentTurnCells: cells } = this.game.state;
    if (cells === undefined || cells.length === 0) return false;
    return cell === this.game.findTopRightCell(cells);
  }

  wasTileUsedInPreviousTurn(tile: GameTile): boolean {
    const { previousTurnTiles: tiles } = this.game.state;
    if (tiles === undefined || tiles.length === 0) return false;
    return tiles.includes(tile);
  }

  placeTile({ cell, tile }: { cell: GameCell; tile: GameTile }): void {
    this.game.placeTile({ cell, tile });
    this.game.validateCurrentTurn();
  }

  undoPlaceTile(tile: GameTile): void {
    this.game.undoPlaceTile({ tile });
    this.game.validateCurrentTurn();
  }

  resetTurn(): void {
    this.game.resetCurrentTurn();
  }

  handleSaveTurn(): { userResponse: AppTurnResponse; opponentTurn?: Promise<AppTurnResponse> } {
    const { currentPlayer: player } = this.game.state;
    const userResponse = this.saveTurn();
    if (!userResponse.ok) {
      return { userResponse };
    }
    if (!this.game.hasTilesFor(player)) {
      this.game.endMatchByScore();
      return { userResponse };
    }
    if (this.game.state.matchIsFinished) {
      return { userResponse };
    }
    const opponentTurn = this.game.state.currentPlayer === GamePlayer.Opponent ? this.executeOpponentTurn() : undefined;
    return { userResponse, opponentTurn };
  }

  handlePassTurn(): { opponentTurn?: Promise<AppTurnResponse> } {
    if (this.game.willPlayerPassBeResign(GamePlayer.User)) {
      this.game.resignMatchForCurrentPlayer();
      return {};
    }
    this.game.passCurrentTurn();
    const opponentTurn = this.game.state.currentPlayer === GamePlayer.Opponent ? this.executeOpponentTurn() : undefined;
    return { opponentTurn };
  }

  handleResignMatch(): void {
    this.game.resignMatchForCurrentPlayer();
  }

  clearAllGameEvents(): Array<GameEvent> {
    return this.game.clearAllEvents();
  }

  private saveTurn(): AppTurnResponse {
    if (!this.game.state.currentTurnIsValid) return { ok: false, error: 'Turn is not valid' };
    const { words } = this.game.saveCurrentTurn();
    return { ok: true, value: { words } };
  }

  private async executeOpponentTurn(): Promise<AppTurnResponse> {
    const resolution = await this.ensureMinimumDuration(() => this.createOpponentTurn());
    switch (resolution.type) {
      case GameTurnResolutionType.Resign:
        this.game.resignMatchForCurrentPlayer();
        return { ok: true, value: { words: [] } };
      case GameTurnResolutionType.Pass:
        return { ok: true, value: { words: [] } };
      case GameTurnResolutionType.Save:
        if (!this.game.hasTilesFor(GamePlayer.Opponent)) this.game.endMatchByScore();
        return { ok: true, value: { words: resolution.words } };
      default:
        throw new Error(`Unexpected resolution type: ${(resolution as { type: string }).type}`);
    }
  }

  private async createOpponentTurn(): Promise<GameTurnResolution> {
    const player = GamePlayer.Opponent;
    let generatorResult = null;
    for await (const result of this.game.generateTurnFor(player, () => this.scheduler.yield())) {
      generatorResult = result;
      break;
    }
    if (generatorResult === null) {
      if (this.game.willPlayerPassBeResign(player)) return { type: GameTurnResolutionType.Resign, player };
      this.game.passCurrentTurn();
      return { type: GameTurnResolutionType.Pass, player };
    }
    for (let i = 0; i < generatorResult.tiles.length; i++) {
      this.game.placeTile({ cell: generatorResult.cells[i], tile: generatorResult.tiles[i] });
    }
    this.game.validateCurrentTurn();
    const words = this.game.state.currentTurnWords ?? [];
    const score = this.game.state.currentTurnScore ?? 0;
    this.saveTurn();
    return { type: GameTurnResolutionType.Save, player, words, score };
  }

  private async ensureMinimumDuration<T>(callback: () => Promise<T> | T): Promise<T> {
    const startTime = this.clock.now();
    const result = await callback();
    const elapsed = this.clock.now() - startTime;
    const delay = Application.OPPONENT_RESPONSE_MIN_TIME - elapsed;
    if (delay > 0) await this.clock.wait(delay);
    return result;
  }

  private simplifyTurnResolution(resolution: GameTurnResolution): AppTurnResolution {
    const isSave = resolution.type === GameTurnResolutionType.Save;
    const isUser = resolution.player === GamePlayer.User;
    return {
      isSave,
      isUser,
      ...(isSave && {
        words: resolution.words.join(', '),
        score: resolution.score,
      }),
    };
  }
}
