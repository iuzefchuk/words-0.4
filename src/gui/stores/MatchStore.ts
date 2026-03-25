import { defineStore } from 'pinia';
import { computed, markRaw, Ref, shallowRef } from 'vue';
import Application from '@/application/index.ts';
import { GameCell, GameTile, AppState, AppQueries } from '@/application/types.ts';
import { EVENT_SOUNDS } from '@/gui/constants.ts';
import SoundPlayer from '@/gui/services/SoundPlayer.ts';

let app: Application;

export async function startMatch(): Promise<void> {
  app = markRaw(await Application.create());
}

export default class MatchStore {
  static readonly INSTANCE = defineStore('match', () => {
    const store = new MatchStore(app);
    return {
      ...app.config,
      ...store.state,
      ...store.queries,
      ...store.commands,
    };
  });

  private readonly state: MatchState;
  private readonly queries: MatchQueries;
  private readonly commands: MatchCommands;

  private constructor(app: Application) {
    this.state = new MatchState(() => app.state);
    this.queries = new MatchQueries(app.queries, this.state);
    this.commands = new MatchCommands(app, this.state);
  }
}

class MatchState {
  readonly tilesRemaining = computed(() => this.appStateRef.value.tilesRemaining);
  readonly userTiles = computed(() => this.appStateRef.value.userTiles);
  readonly userScore = computed(() => this.appStateRef.value.userScore);
  readonly opponentScore = computed(() => this.appStateRef.value.opponentScore);
  readonly currentPlayerIsUser = computed(() => this.appStateRef.value.currentPlayerIsUser);
  readonly currentTurnScore = computed(() => this.appStateRef.value.currentTurnScore);
  readonly currentTurnIsValid = computed(() => this.appStateRef.value.currentTurnIsValid);
  readonly userPassWillBeResign = computed(() => this.appStateRef.value.userPassWillBeResign);
  readonly turnResolutionHistory = computed(() => this.appStateRef.value.turnResolutionHistory);
  readonly matchIsFinished = computed(() => this.appStateRef.value.matchIsFinished);
  readonly matchResult = computed(() => this.appStateRef.value.matchResult);

  private readonly appStateRef: Ref<AppState>;

  constructor(private readonly getAppState: () => AppState) {
    this.appStateRef = shallowRef(getAppState());
  }

  read<T>(fn: () => T): T {
    void this.appStateRef.value;
    return fn();
  }

  write<T>(fn: () => T): T {
    const result = fn();
    this.sync();
    if (result instanceof Promise) {
      result.then(() => this.sync());
    }
    return result;
  }

  sync(): void {
    this.appStateRef.value = this.getAppState();
  }
}

class MatchQueries {
  constructor(
    private readonly appQueries: AppQueries,
    private readonly matchState: MatchState,
  ) {}

  areTilesSame = (firstTile: GameTile, secondTile: GameTile) => this.appQueries.areTilesSame(firstTile, secondTile);
  getTileLetter = (tile: GameTile) => this.appQueries.getTileLetter(tile);
  isCellCenter = (cell: GameCell) => this.appQueries.isCellCenter(cell);
  getCellBonus = (cell: GameCell) => this.appQueries.getCellBonus(cell);
  getCellRowIndex = (cell: GameCell) => this.appQueries.getCellRowIndex(cell);
  getCellColumnIndex = (cell: GameCell) => this.appQueries.getCellColumnIndex(cell);
  findTileOnCell = (cell: GameCell) => this.matchState.read(() => this.appQueries.findTileOnCell(cell));
  findCellWithTile = (tile: GameTile) => this.matchState.read(() => this.appQueries.findCellWithTile(tile));
  isTilePlaced = (tile: GameTile) => this.matchState.read(() => this.appQueries.isTilePlaced(tile));
  isCellTopRightInCurrentTurn = (cell: GameCell) =>
    this.matchState.read(() => this.appQueries.isCellTopRightInCurrentTurn(cell));
  wasTileUsedInPreviousTurn = (tile: GameTile) =>
    this.matchState.read(() => this.appQueries.wasTileUsedInPreviousTurn(tile));
}

class MatchCommands {
  constructor(
    private readonly app: Application,
    private readonly matchState: MatchState,
  ) {}

  placeTile = (args: { cell: GameCell; tile: GameTile }): void => {
    return this.writeAndPlaySound(() => this.app.placeTile(args));
  };

  undoPlaceTile = (tile: GameTile): void => {
    return this.writeAndPlaySound(() => this.app.undoPlaceTile(tile));
  };

  clearTiles = (): void => {
    return this.matchState.write(() => this.app.clearTiles());
  };

  save = (): void => {
    const { opponentTurn } = this.writeAndPlaySound(() => this.app.handleSaveTurn());
    opponentTurn?.then(() => this.syncAndPlaySound());
  };

  pass = (): void => {
    const { opponentTurn } = this.writeAndPlaySound(() => this.app.handlePassTurn());
    opponentTurn?.then(() => this.syncAndPlaySound());
  };

  resign = (): void => {
    return this.writeAndPlaySound(() => this.app.handleResignMatch());
  };

  private syncAndPlaySound(): void {
    this.matchState.sync();
    this.playPendingSounds();
  }

  private writeAndPlaySound<CallbackResponse>(callback: () => CallbackResponse): CallbackResponse {
    const response = this.matchState.write(callback);
    this.playPendingSounds();
    return response;
  }

  private playPendingSounds(): void {
    for (const event of this.app.clearAllGameEvents()) {
      const sound = EVENT_SOUNDS[event];
      if (sound) SoundPlayer.play(sound);
    }
  }
}
