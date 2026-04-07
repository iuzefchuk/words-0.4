import { defineStore } from 'pinia';
import { computed, markRaw, ref } from 'vue';
import Application from '@/application/index.ts';
import { AppCommands, AppQueries, GameBonusDistribution, GameCell, GameDifficulty, GameSettings, GameTile } from '@/application/types.ts';
import { DEFAULT_SETTINGS, GAME_EVENT_SOUNDS, SETTINGS_STORAGE_KEY } from '@/presentation/constants.ts';
import LocalStorage from '@/presentation/services/LocalStorage.ts';
import SoundPlayer from '@/presentation/services/SoundPlayer.ts';

class MatchCommands {
  constructor(
    private readonly appCommands: AppCommands,
    private readonly matchState: MatchState,
  ) {}

  changeBonusDistribution = (bonusDistribution: GameBonusDistribution): void => {
    MainStore.saveSettings({ bonusDistribution });
    return this.matchState.writeOnlyBoard(() => this.appCommands.changeBonusDistribution(bonusDistribution));
  };

  changeDifficulty = (difficulty: GameDifficulty): void => {
    MainStore.saveSettings({ difficulty });
    return this.matchState.write(() => this.appCommands.changeDifficulty(difficulty));
  };

  clearTiles = (): void => {
    return this.matchState.writeOnlyBoard(() => this.appCommands.clearTiles());
  };

  pass = (): void => {
    const { opponentTurn } = this.writeStateAndPlaySound(() => this.appCommands.handlePassTurn());
    opponentTurn?.then(() => this.syncAndPlaySound());
  };

  placeTile = (args: { cell: GameCell; tile: GameTile }): void => {
    return this.writeBoardAndPlaySound(() => this.appCommands.placeTile(args));
  };

  resign = (): void => {
    return this.writeStateAndPlaySound(() => this.appCommands.handleResignMatch());
  };

  save = (): void => {
    const { opponentTurn } = this.writeStateAndPlaySound(() => this.appCommands.handleSaveTurn());
    opponentTurn?.then(() => this.syncAndPlaySound());
  };

  undoPlaceTile = (tile: GameTile): void => {
    return this.writeBoardAndPlaySound(() => this.appCommands.undoPlaceTile(tile));
  };

  private playPendingSounds(): void {
    for (const event of this.appCommands.clearAllEvents()) {
      const sound = GAME_EVENT_SOUNDS[event.type];
      if (sound) SoundPlayer.play(sound);
    }
  }

  private syncAndPlaySound(): void {
    this.matchState.incrementVersions();
    this.playPendingSounds();
  }

  private writeBoardAndPlaySound<CallbackResponse>(callback: () => CallbackResponse): CallbackResponse {
    const response = this.matchState.writeOnlyBoard(callback);
    this.playPendingSounds();
    return response;
  }

  private writeStateAndPlaySound<CallbackResponse>(callback: () => CallbackResponse): CallbackResponse {
    const response = this.matchState.write(callback);
    this.playPendingSounds();
    return response;
  }
}

class MatchQueries {
  readonly bonusDistribution = computed(() => this.readBoard(() => this.appQueries.getBonusDistribution()));
  readonly currentPlayerIsUser = computed(() => this.readState(() => this.appQueries.isCurrentPlayerUser()));
  readonly currentTurnIsValid = computed(() => this.readBoard(() => this.appQueries.isCurrentTurnValid()));
  readonly currentTurnScore = computed(() => this.readBoard(() => this.appQueries.getCurrentTurnScore()));
  readonly difficulty = computed(() => this.readState(() => this.appQueries.getDifficulty()));
  readonly eventLog = computed(() => this.readState(() => this.appQueries.getEventLog()));
  readonly hasPriorTurns = computed(() => this.readState(() => this.appQueries.hasPriorTurns()));
  readonly matchIsFinished = computed(() => this.readState(() => this.appQueries.isMatchFinished()));
  readonly matchResult = computed(() => this.readState(() => this.appQueries.getMatchResult()));
  readonly opponentScore = computed(() => this.readState(() => this.appQueries.getOpponentScore()));
  readonly settingsChangeIsAllowed = computed(() => this.readState(() => this.appQueries.settingsChangeIsAllowed()));
  readonly tilesRemaining = computed(() => this.readState(() => this.appQueries.getTilesRemaining()));
  readonly userPassWillBeResign = computed(() => this.readState(() => this.appQueries.willUserPassBeResign()));
  readonly userScore = computed(() => this.readState(() => this.appQueries.getUserScore()));
  readonly userTiles = computed(() => this.readState(() => this.appQueries.getUserTiles()));

  constructor(
    private readonly appQueries: AppQueries,
    private readonly matchState: MatchState,
  ) {}

  areTilesSame = (firstTile: GameTile, secondTile: GameTile) => this.appQueries.areTilesSame(firstTile, secondTile);
  findCellWithTile = (tile: GameTile) => this.readBoard(() => this.appQueries.findCellWithTile(tile));
  findTileOnCell = (cell: GameCell) => this.readBoard(() => this.appQueries.findTileOnCell(cell));
  getCellBonus = (cell: GameCell) => this.readBoard(() => this.appQueries.getCellBonus(cell));
  getCellColumnIndex = (cell: GameCell) => this.appQueries.getCellColumnIndex(cell);
  getCellRowIndex = (cell: GameCell) => this.appQueries.getCellRowIndex(cell);
  getTileLetter = (tile: GameTile) => this.appQueries.getTileLetter(tile);
  isCellCenter = (cell: GameCell) => this.appQueries.isCellCenter(cell);
  isTilePlaced = (tile: GameTile) => this.readBoard(() => this.appQueries.isTilePlaced(tile));
  wasTileUsedInPreviousTurn = (tile: GameTile) => this.readBoard(() => this.appQueries.wasTileUsedInPreviousTurn(tile));

  private readBoard<T>(fn: () => T): T {
    return this.matchState.readOnlyBoard(fn);
  }

  private readState<T>(fn: () => T): T {
    return this.matchState.read(fn);
  }
}

class MatchState {
  private readonly boardVersion = ref(0);
  private readonly stateVersion = ref(0);

  incrementVersions(): void {
    this.boardVersion.value++;
    this.stateVersion.value++;
  }

  read<T>(fn: () => T): T {
    void this.stateVersion.value;
    return fn();
  }

  readOnlyBoard<T>(fn: () => T): T {
    void this.boardVersion.value;
    return fn();
  }

  write<T>(fn: () => T): T {
    const result = fn();
    this.incrementVersions();
    if (result instanceof Promise) {
      result.then(() => this.incrementVersions());
    }
    return result;
  }

  writeOnlyBoard<T>(fn: () => T): T {
    const result = fn();
    this.boardVersion.value++;
    return result;
  }
}

export default class MainStore {
  private static app: Application;

  static readonly INSTANCE = defineStore('main', () => {
    const store = new MainStore(MainStore.app);
    return {
      ...MainStore.app.config,
      ...store.queries,
      ...store.commands,
    };
  });
  private readonly commands: MatchCommands;
  private readonly queries: MatchQueries;

  private constructor(app: Application) {
    const matchState = new MatchState();
    this.queries = new MatchQueries(app.queries, matchState);
    this.commands = new MatchCommands(app.commands, matchState);
  }

  static saveSettings(data: { bonusDistribution?: GameBonusDistribution; difficulty?: GameDifficulty }): void {
    const existingCache = this.loadSettings();
    const newCache = {
      bonusDistribution: data?.bonusDistribution ?? existingCache?.bonusDistribution,
      difficulty: data?.difficulty ?? existingCache?.difficulty,
    };
    LocalStorage.save(SETTINGS_STORAGE_KEY, newCache);
  }

  static async start(): Promise<void> {
    const settings = MainStore.loadSettings();
    MainStore.app = markRaw(await Application.create(settings));
  }

  private static loadSettings(): GameSettings {
    const cache = LocalStorage.load(SETTINGS_STORAGE_KEY) as null | Partial<GameSettings>;
    return {
      bonusDistribution: cache?.bonusDistribution ?? DEFAULT_SETTINGS.bonusDistribution,
      difficulty: cache?.difficulty ?? DEFAULT_SETTINGS.difficulty,
    };
  }
}
