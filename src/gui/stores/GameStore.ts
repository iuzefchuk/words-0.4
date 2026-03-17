import Game, { GameCell, GameState, GameTile } from '@/application/index.ts';
import { defineStore } from 'pinia';
import { computed, Ref, shallowRef } from 'vue';
import SoundPlayer, { Sound } from '@/infrastructure/SoundPlayer.ts';

let game: Game;

export async function startGame(): Promise<void> {
  game = await Game.start();
}

export default class GameStore {
  private static readonly soundPlayer = new SoundPlayer();

  static readonly getInstance = defineStore('game', () => {
    const state = new GameStore.ReactiveState(game);
    return {
      bonuses: Game.bonuses,
      letters: Game.letters,
      layoutCells: game.layoutCells,
      gameIsFinished: state.isFinished,
      tilesRemaining: state.tilesRemaining,
      userTiles: state.userTiles,
      currentTurnScore: state.currentTurnScore,
      userScore: state.userScore,
      opponentScore: state.opponentScore,
      currentPlayerIsUser: state.currentPlayerIsUser,
      userPassWillBeResign: state.userPassWillBeResign,
      isCellInCenterOfLayout: (cell: GameCell) => game.isCellInCenterOfLayout(cell),
      getCellBonus: (cell: GameCell) => game.getCellBonus(cell),
      findTileOnCell: (cell: GameCell) => state.voidRefBefore(() => game.findTileByCell(cell)),
      findCellWithTile: (tile: GameTile) => state.voidRefBefore(() => game.findCellByTile(tile)),
      isTilePlaced: (tile: GameTile) => state.voidRefBefore(() => game.isTilePlaced(tile)),
      areTilesSame: (firstTile: GameTile, secondTile: GameTile) => game.areTilesSame(firstTile, secondTile),
      getTileLetter: (tile: GameTile) => game.getTileLetter(tile),
      isCellLastConnectionInTurn: (cell: GameCell) => state.voidRefBefore(() => game.isCellLastConnectionInTurn(cell)),
      wasTileUsedInPreviousTurn: (tile: GameTile) => state.voidRefBefore(() => game.wasTileUsedInPreviousTurn(tile)),
      shuffleUserTiles: () => {
        state.triggerRefAfter(() => game.shuffleUserTiles());
        this.soundPlayer.play(Sound.TilesShuffled);
      },
      placeTile: (args: { cell: GameCell; tile: GameTile }) => {
        state.triggerRefAfter(() => game.placeTile(args));
        this.soundPlayer.play(Sound.TilePlaced);
      },
      undoPlaceTile: (tile: GameTile) => {
        state.triggerRefAfter(() => game.undoPlaceTile(tile));
        this.soundPlayer.play(Sound.TileReturned);
      },
      resetTurn: () => state.triggerRefAfter(() => game.resetTurn()),
      saveTurn: () => {
        const result = state.triggerRefAfterWithOpponentTurn(() => game.saveTurn(), game);
        this.soundPlayer.play(Sound.TurnSaved);
        return result;
      },
      passTurn: () => {
        state.triggerRefAfterWithOpponentTurn(() => game.passTurn(), game);
        this.soundPlayer.play(Sound.TurnPassed);
      },
      resignGame: () => {
        state.triggerRefAfter(() => game.resignGame());
        this.soundPlayer.play(Sound.GameFinished);
      },
    };
  });

  private static ReactiveState = class {
    readonly isFinished = computed(() => this.state.isFinished);
    readonly tilesRemaining = computed(() => this.state.tilesRemaining);
    readonly userTiles = computed(() => this.state.userTiles);
    readonly currentTurnScore = computed(() => this.state.currentTurnScore);
    readonly userScore = computed(() => this.state.userScore);
    readonly opponentScore = computed(() => this.state.opponentScore);
    readonly currentPlayerIsUser = computed(() => this.state.currentPlayerIsUser);
    readonly userPassWillBeResign = computed(() => this.state.userPassWillBeResign);

    private readonly stateRef: Ref<GameState>;

    constructor(private readonly game: Game) {
      this.stateRef = shallowRef(this.game.state);
    }

    private get state(): GameState {
      return this.stateRef.value;
    }

    voidRefBefore<T>(callback: () => T): T {
      void this.stateRef.value;
      return callback();
    }

    triggerRefAfter<T>(callback: () => T): T {
      const result = callback();
      this.refreshState();
      if (result instanceof Promise) {
        result.then(() => this.refreshState());
      }
      return result;
    }

    triggerRefAfterWithOpponentTurn(callback: () => void, game: Game): void {
      callback();
      this.refreshState();
      if (!this.currentPlayerIsUser) game.createOpponentTurn().then(() => this.refreshState());
    }

    private refreshState(): void {
      this.stateRef.value = this.game.state;
    }
  };
}
