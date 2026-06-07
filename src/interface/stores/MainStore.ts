import { defineStore } from 'pinia';
import { computed, markRaw, reactive, ref, shallowRef, watch } from 'vue';
import createAppRuntime from '@/index.ts';
import { getEventSound } from '@/interface/mappings.ts';
import SoundPlayer from '@/interface/services/SoundPlayer.ts';
import type App from '@/app/App.ts';
import type { DomainBoardBonus, DomainInventoryLetter, DomainMatchDifficulty, DomainMatchType } from '@/app/enums/index.ts';
import type { DomainBoardCell, DomainInventoryTile } from '@/app/types/index.ts';
import type { Sound } from '@/interface/services/SoundPlayer.ts';
import type { ComputedRef, ShallowRef } from 'vue';

class Actions {
  private lastDrainedEventCount = 0;

  private pendingValidationId = 0;

  constructor(
    private readonly state: State,
    private readonly requireApp: () => App,
  ) {}

  changeMatchDifficulty = (matchDifficulty: DomainMatchDifficulty): void => {
    this.state.write(() => {
      this.requireApp().commands.changeMatchDifficulty(matchDifficulty);
    });
  };

  changeMatchType = (matchType: DomainMatchType): void => {
    this.state.write(() => {
      this.requireApp().commands.changeMatchType(matchType);
    });
  };

  clearUserTiles = (): void => {
    this.state.writeBoard(() => {
      this.requireApp().commands.clearUserTiles();
    });
  };

  pass = (): void => {
    const { opponentTurn } = this.writeAndPlaySound(() => this.requireApp().commands.passTurn());
    void opponentTurn?.then(() => {
      this.syncAndPlaySound();
    });
  };

  placeTile = (args: { cell: DomainBoardCell; tile: DomainInventoryTile }): void => {
    this.writeBoardAndPlaySound(() => {
      this.requireApp().commands.placeTile(args);
    }, [args.cell]);
    this.scheduleDeferredValidation();
  };

  resign = (): void => {
    this.writeAndPlaySound(() => {
      this.requireApp().commands.resignMatch();
    });
  };

  restartGame = (): void => {
    this.state.write(() => {
      this.requireApp().commands.restartGame();
    });
  };

  save = (): void => {
    const { opponentTurn } = this.writeAndPlaySound(() => this.requireApp().commands.saveTurn());
    void opponentTurn?.then(() => {
      this.syncAndPlaySound();
    });
  };

  shuffleUserTiles = (tiles: Array<DomainInventoryTile>): void => {
    this.requireApp().commands.shuffleUserTiles(tiles);
  };

  undoPlaceTile = (tile: DomainInventoryTile): void => {
    const previousCell = this.requireApp().queries.findCellWithTile(tile);
    const affectedCells = previousCell === undefined ? undefined : [previousCell];
    this.writeBoardAndPlaySound(() => {
      this.requireApp().commands.undoPlaceTile(tile);
    }, affectedCells);
    this.scheduleDeferredValidation();
  };

  private playPendingSounds(): void {
    const events = this.requireApp().queries.eventsView;
    if (this.lastDrainedEventCount > events.length) this.lastDrainedEventCount = 0;
    let lastSound: null | Sound = null;
    for (const event of events.slice(this.lastDrainedEventCount)) {
      const sound = getEventSound(event);
      if (sound !== null) lastSound = sound;
    }
    this.lastDrainedEventCount = events.length;
    if (lastSound !== null) SoundPlayer.execute(lastSound);
  }

  private readonly scheduleDeferredValidation = (): void => {
    const validationId = ++this.pendingValidationId;
    void this.requireApp()
      .yield()
      .then(() => {
        if (validationId !== this.pendingValidationId) return;
        this.writeBoardAndPlaySound(() => {
          this.requireApp().commands.validateTurn();
        }, []);
      });
  };

  private syncAndPlaySound(): void {
    this.state.incrementVersions();
    this.playPendingSounds();
  }

  private writeAndPlaySound<R>(callback: () => R): R {
    const response = this.state.write(callback);
    this.playPendingSounds();
    return response;
  }

  private writeBoardAndPlaySound<R>(callback: () => R, affectedCells?: ReadonlyArray<DomainBoardCell>): R {
    const response = this.state.writeBoard(callback, affectedCells);
    this.playPendingSounds();
    return response;
  }
}

class Getters {
  readonly currentPlayerIsUser = this.read(queries => queries.currentPlayerIsUser);

  readonly allActionsAreDisabled = computed(() => !this.currentPlayerIsUser.value);

  readonly boardCells = this.read(queries => queries.boardCells);

  readonly boardCellsPerAxis = this.read(queries => queries.boardCellsPerAxis);

  readonly currentTurnIsValid = this.readBoard(queries => queries.currentTurnIsValid);

  readonly currentTurnScore = this.readBoard(queries => queries.currentTurnScore);

  readonly events = this.read(queries => [...queries.eventsView]);

  readonly hasPriorTurns = this.read(queries => queries.turnHistoryHasPriorTurns);

  readonly matchDifficulty = this.read(queries => queries.matchDifficulty);

  readonly matchIsFinished = this.read(queries => queries.matchIsFinished);

  readonly matchResult = this.read(queries => queries.matchResult);

  readonly matchType = this.readBoard(queries => queries.matchType);

  readonly opponentScore = this.read(queries => queries.opponentScore);

  readonly settingsChangeIsAllowed = this.read(queries => queries.settingsChangeIsAllowed);

  readonly tilesPerPlayer = this.read(queries => queries.tilesPerPlayer);

  readonly tilesRemaining = this.read(queries => queries.tilesRemaining);

  readonly userPassWillBeResign = this.read(queries => queries.userPassWillBeResign);

  readonly userScore = this.read(queries => queries.userScore);

  readonly userTiles = this.read(queries => queries.userTiles);

  constructor(
    private readonly state: State,
    private readonly requireApp: () => App,
  ) {}

  areTilesSame = (firstTile: DomainInventoryTile, secondTile: DomainInventoryTile): boolean =>
    this.requireApp().queries.areTilesSame(firstTile, secondTile);

  findCellWithTile = (tile: DomainInventoryTile): DomainBoardCell | undefined =>
    this.state.readBoard(() => this.requireApp().queries.findCellWithTile(tile));

  findTileOnCell = (cell: DomainBoardCell): DomainInventoryTile | undefined => this.state.tileByCellCache.get(cell);

  getAdjacentCells = (cell: DomainBoardCell): ReadonlyArray<DomainBoardCell> => this.requireApp().queries.getAdjacentCells(cell);

  getCellBonus = (cell: DomainBoardCell): DomainBoardBonus | null =>
    this.state.readBoard(() => this.requireApp().queries.getCellBonus(cell));

  getCellColumnIndex = (cell: DomainBoardCell): number => this.requireApp().queries.getCellColumnIndex(cell);

  getCellRowIndex = (cell: DomainBoardCell): number => this.requireApp().queries.getCellRowIndex(cell);

  getLetterPoints = (letter: DomainInventoryLetter): number => this.requireApp().queries.getLetterPoints(letter);

  getTileLetter = (tile: DomainInventoryTile): DomainInventoryLetter => this.requireApp().queries.getTileLetter(tile);

  isCellCenter = (cell: DomainBoardCell): boolean => this.requireApp().queries.isCellCenter(cell);

  isTilePlaced = (tile: DomainInventoryTile): boolean => this.state.readBoard(() => this.requireApp().queries.isTilePlaced(tile));

  wasTileUsedInPreviousTurn = (tile: DomainInventoryTile): boolean =>
    this.state.readBoard(() => this.requireApp().queries.wasTileUsedInPreviousTurn(tile));

  private read<T>(fn: (queries: App['queries']) => T): ComputedRef<T> {
    return computed(() => this.state.read(() => fn(this.requireApp().queries)));
  }

  private readBoard<T>(fn: (queries: App['queries']) => T): ComputedRef<T> {
    return computed(() => this.state.readBoard(() => fn(this.requireApp().queries)));
  }
}

class State {
  readonly tileByCellCache: Map<DomainBoardCell, DomainInventoryTile> = reactive(new Map());

  private readonly boardVersion = ref(0);

  private readonly stateVersion = ref(0);

  constructor(private readonly appRef: ShallowRef<App | null>) {
    watch(
      this.appRef,
      () => {
        this.syncTileByCellCache();
      },
      { flush: 'sync', immediate: true },
    );
  }

  incrementVersions(): void {
    this.boardVersion.value++;
    this.stateVersion.value++;
    this.syncTileByCellCache();
  }

  read<T>(fn: () => T): T {
    void this.stateVersion.value;
    return fn();
  }

  readBoard<T>(fn: () => T): T {
    void this.boardVersion.value;
    return fn();
  }

  write<T>(fn: () => T): T {
    const result = fn();
    this.incrementVersions();
    if (result instanceof Promise) {
      result.then(
        () => {
          this.incrementVersions();
        },
        () => {
          this.incrementVersions();
        },
      );
    }
    return result;
  }

  writeBoard<T>(fn: () => T, affectedCells?: ReadonlyArray<DomainBoardCell>): T {
    const result = fn();
    this.boardVersion.value++;
    this.syncTileByCellCache(affectedCells);
    return result;
  }

  private syncTileByCellCache(affectedCells?: ReadonlyArray<DomainBoardCell>): void {
    const app = this.appRef.value;
    if (app === null) return;
    const cells = affectedCells ?? app.queries.boardCells;
    for (const cell of cells) {
      const tile = app.queries.findTileOnCell(cell);
      if (tile !== undefined) {
        if (this.tileByCellCache.get(cell) !== tile) this.tileByCellCache.set(cell, tile);
      } else if (this.tileByCellCache.has(cell)) {
        this.tileByCellCache.delete(cell);
      }
    }
  }
}

export default class MainStore {
  private static readonly SINGLETON = new MainStore();

  static readonly INSTANCE = defineStore('main', () => {
    const { appRef, bootError, bootProgress } = MainStore.SINGLETON;
    const requireApp = (): App => {
      if (appRef.value === null) throw new Error('MainStore: app is not ready');
      return appRef.value;
    };
    const state = new State(appRef);
    const getters = new Getters(state, requireApp);
    const actions = new Actions(state, requireApp);
    return {
      bootError,
      bootProgress,
      ...(getters as { [K in keyof Getters]: Getters[K] }),
      ...(actions as { [K in keyof Actions]: Actions[K] }),
    };
  });

  private readonly appRef = shallowRef<App | null>(null);

  private readonly bootError = ref<null | string>(null);

  private readonly bootProgress = ref(0);

  static async initiate(): Promise<void> {
    const singleton = MainStore.SINGLETON;
    const { bootProgressPublisher, promise } = createAppRuntime();
    bootProgressPublisher.subscribe(progress => {
      singleton.bootProgress.value = progress;
    });
    try {
      const app = await promise;
      singleton.appRef.value = markRaw(app);
    } catch (error: unknown) {
      singleton.bootError.value = error instanceof Error ? error.message : String(error);
    }
  }
}
