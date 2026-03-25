import {
  AppConfig,
  AppState,
  AppQueries,
  AppTurnResponse,
  AppTurnResolution,
  GamePlayer,
  GameCell,
  GameBoardView,
  GameTile,
  GameInventoryView,
  GameTurnResolution,
  GameTurnResolutionType,
  GameMatchView,
  GameTurnView,
  GameEvent,
} from '@/application/types.ts';
import Game from '@/domain/index.ts';
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
    return {
      boardCells: this.boardView.cells,
      boardCellsPerAxis: this.boardView.cellsPerAxis,
    };
  }

  get state(): AppState {
    return {
      tilesRemaining: this.inventoryView.unusedTilesCount,
      userTiles: this.inventoryView.getTilesFor(GamePlayer.User),
      userScore: this.turnView.getScoreFor(GamePlayer.User),
      opponentScore: this.turnView.getScoreFor(GamePlayer.Opponent),
      currentPlayerIsUser: this.turnView.currentPlayer === GamePlayer.User,
      currentTurnScore: this.turnView.currentTurnScore,
      currentTurnIsValid: this.turnView.currentTurnIsValid,
      userPassWillBeResign: this.turnView.willPassBeResignFor(GamePlayer.User),
      turnResolutionHistory: this.turnView.resolutionHistory.map(r => this.simplifyTurnResolution(r)),
      matchIsFinished: this.matchView.matchIsFinished,
      matchResult: this.matchView.getResultFor(GamePlayer.User),
    };
  }

  get queries(): AppQueries {
    return {
      areTilesSame: (first: GameTile, second: GameTile) => this.inventoryView.areTilesEqual(first, second),
      getTileLetter: (tile: GameTile) => this.inventoryView.getTileLetter(tile),
      isCellCenter: (cell: GameCell) => this.boardView.isCellCenter(cell),
      getCellBonus: (cell: GameCell) => this.boardView.getBonus(cell),
      getCellRowIndex: (cell: GameCell) => this.boardView.getRowIndex(cell),
      getCellColumnIndex: (cell: GameCell) => this.boardView.getColumnIndex(cell),
      findTileOnCell: (cell: GameCell) => this.boardView.findTileByCell(cell),
      findCellWithTile: (tile: GameTile) => this.boardView.findCellByTile(tile),
      isTilePlaced: (tile: GameTile) => this.boardView.isTilePlaced(tile),
      isCellTopRightInCurrentTurn: (cell: GameCell) => this.isCellTopRightInCurrentTurn(cell),
      wasTileUsedInPreviousTurn: (tile: GameTile) => this.wasTileUsedInPreviousTurn(tile),
    };
  }

  placeTile({ cell, tile }: { cell: GameCell; tile: GameTile }): void {
    this.game.placeTile({ cell, tile });
    this.game.validateTurn();
  }

  undoPlaceTile(tile: GameTile): void {
    this.game.undoPlaceTile({ tile });
    this.game.validateTurn();
  }

  clearTiles(): void {
    this.game.clearTiles();
  }

  handleSaveTurn(): { userResponse: AppTurnResponse; opponentTurn?: Promise<AppTurnResponse> } {
    const player = this.currentPlayer;
    const userResponse = this.saveTurn();
    if (!userResponse.ok) {
      return { userResponse };
    }
    if (!this.inventoryView.hasTilesFor(player)) {
      this.game.endMatchByScore();
      return { userResponse };
    }
    if (this.game.matchView.matchIsFinished) {
      return { userResponse };
    }
    const opponentTurn = this.currentPlayer === GamePlayer.Opponent ? this.executeOpponentTurn() : undefined;
    return { userResponse, opponentTurn };
  }

  handlePassTurn(): { opponentTurn?: Promise<AppTurnResponse> } {
    if (this.turnView.willPassBeResignFor(GamePlayer.User)) {
      this.game.resignMatch();
      return {};
    }
    this.game.passTurn();
    const opponentTurn = this.currentPlayer === GamePlayer.Opponent ? this.executeOpponentTurn() : undefined;
    return { opponentTurn };
  }

  handleResignMatch(): void {
    this.game.resignMatch();
  }

  clearAllGameEvents(): Array<GameEvent> {
    return this.game.clearAllEvents();
  }

  private get boardView(): Readonly<GameBoardView> {
    return this.game.boardView;
  }

  private get inventoryView(): Readonly<GameInventoryView> {
    return this.game.inventoryView;
  }

  private get turnView(): Readonly<GameTurnView> {
    return this.game.turnView;
  }

  private get matchView(): Readonly<GameMatchView> {
    return this.game.matchView;
  }

  private get currentPlayer(): GamePlayer {
    return this.game.turnView.currentPlayer;
  }

  private isCellTopRightInCurrentTurn(cell: GameCell): boolean {
    const { currentTurnCells: cells } = this.game.turnView;
    if (cells === undefined || cells.length === 0) return false;
    return cell === this.boardView.findTopRightCell(cells);
  }

  private wasTileUsedInPreviousTurn(tile: GameTile): boolean {
    const { previousTurnTiles: tiles } = this.game.turnView;
    if (tiles === undefined || tiles.length === 0) return false;
    return tiles.includes(tile);
  }

  private saveTurn(): AppTurnResponse {
    if (!this.game.turnView.currentTurnIsValid) return { ok: false, error: 'Turn is not valid' };
    const { words } = this.game.saveTurn();
    return { ok: true, value: { words } };
  }

  private async executeOpponentTurn(): Promise<AppTurnResponse> {
    const resolution = await this.ensureMinimumDuration(() => this.createOpponentTurn());
    switch (resolution.type) {
      case GameTurnResolutionType.Resign:
        this.game.resignMatch();
        return { ok: true, value: { words: [] } };
      case GameTurnResolutionType.Pass:
        return { ok: true, value: { words: [] } };
      case GameTurnResolutionType.Save:
        if (!this.inventoryView.hasTilesFor(GamePlayer.Opponent)) this.game.endMatchByScore();
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
      if (this.turnView.willPassBeResignFor(player)) return { type: GameTurnResolutionType.Resign, player };
      this.game.passTurn();
      return { type: GameTurnResolutionType.Pass, player };
    }
    for (let i = 0; i < generatorResult.tiles.length; i++) {
      this.game.placeTile({ cell: generatorResult.cells[i], tile: generatorResult.tiles[i] });
    }
    this.game.validateTurn();
    const words = this.game.turnView.currentTurnWords ?? [];
    const score = this.game.turnView.currentTurnScore ?? 0;
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
