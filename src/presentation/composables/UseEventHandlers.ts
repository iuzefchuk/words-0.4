import { inject } from 'vue';
import { GameCell, GameTile } from '@/domain/types/index.ts';
import ProvidesPlugin from '@/presentation/plugins/ProvidesPlugin.ts';
import SoundPlayer, { Sound } from '@/presentation/services/SoundPlayer.ts';
import ApplicationStore from '@/presentation/stores/ApplicationStore.ts';
import DialogStore from '@/presentation/stores/DialogStore.ts';
import FooStore from '@/presentation/stores/FooStore.ts';

export default class UseEventHandlers {
  get selectedTile(): GameTile | null {
    return this.fooStore.selectedTile;
  }

  private get applicationStore() {
    return ApplicationStore.INSTANCE();
  }

  private get dialogStore() {
    return DialogStore.INSTANCE();
  }

  private get fooStore() {
    return FooStore.INSTANCE();
  }

  private constructor(private readonly resignDelayMs: number) {}

  static create(): UseEventHandlers {
    const transitionDurationMs = inject(ProvidesPlugin.TRANSITION_DURATION_MS_KEY, 0);
    const resignDelayMs = transitionDurationMs * 2;
    return new UseEventHandlers(resignDelayMs);
  }

  handleClear(): void {
    this.applicationStore.clearTiles();
    this.fooStore.initialize();
    SoundPlayer.play(Sound.SystemClear);
  }

  handleClickBoardCell(cell: GameCell): void {
    const selected = this.selectedTile;
    if (selected === null) return;
    if (this.applicationStore.findTileOnCell(cell) !== undefined) return;
    if (this.fooStore.selectedTileIsPlaced) this.applicationStore.undoPlaceTile(selected);
    this.applicationStore.placeTile({ cell, tile: selected });
    this.fooStore.deselectTile();
  }

  handleClickBoardTile(tile: GameTile): void {
    if (!this.fooStore.isTileInRack(tile)) return;
    if (this.fooStore.isTileSelected(tile)) {
      this.fooStore.deselectTile();
      return;
    }
    const selected = this.selectedTile;
    if (selected === null) {
      this.fooStore.selectTile(tile);
      return;
    }
    const targetCell = this.applicationStore.findCellWithTile(tile);
    if (targetCell === undefined) return;
    const selectedCell = this.applicationStore.findCellWithTile(selected);
    if (selectedCell !== undefined) {
      this.applicationStore.undoPlaceTile(selected);
      this.applicationStore.undoPlaceTile(tile);
      this.applicationStore.placeTile({ cell: selectedCell, tile });
      this.applicationStore.placeTile({ cell: targetCell, tile: selected });
    } else {
      this.applicationStore.undoPlaceTile(tile);
      this.applicationStore.placeTile({ cell: targetCell, tile: selected });
      this.fooStore.switchTiles(selected, tile);
    }
    this.fooStore.deselectTile();
  }

  handleClickRackCell(idx: number): void {
    const tile = this.fooStore.tiles[idx];
    if (tile === undefined) throw new ReferenceError('Tile must be defined');
    const selected = this.selectedTile;
    if (selected === null) {
      if (this.applicationStore.isTilePlaced(tile)) this.applicationStore.undoPlaceTile(tile);
      return;
    }
    if (this.fooStore.selectedTileIsPlaced) this.applicationStore.undoPlaceTile(selected);
    this.fooStore.switchTiles(selected, tile);
    this.fooStore.deselectTile();
  }

  handleClickRackTile(tile: GameTile): void {
    const selected = this.selectedTile;
    if (selected === null) {
      this.fooStore.selectTile(tile);
      return;
    }
    if (!this.fooStore.isTileSelected(tile)) {
      const selectedCell = this.applicationStore.findCellWithTile(selected);
      if (selectedCell !== undefined) {
        this.applicationStore.undoPlaceTile(selected);
        this.applicationStore.placeTile({ cell: selectedCell, tile });
      }
      this.fooStore.switchTiles(selected, tile);
    }
    this.fooStore.deselectTile();
  }

  handleDoubleClickBoardTile(tile: GameTile): void {
    if (!this.fooStore.isTileInRack(tile)) return;
    this.fooStore.deselectTile();
    this.applicationStore.undoPlaceTile(tile);
  }

  handleGameRestart(): void {
    this.applicationStore.restartGame();
    this.fooStore.initialize();
  }

  async handlePass(): Promise<void> {
    if (this.applicationStore.userPassWillBeResign) return this.handleResign();
    const { isConfirmed } = await this.triggerPassDialog();
    if (!isConfirmed) return;
    this.applicationStore.pass();
  }

  handlePlay(): void {
    this.applicationStore.save();
    this.fooStore.initialize();
  }

  async handleResign(): Promise<void> {
    const { isConfirmed } = await this.triggerResignDialog();
    if (!isConfirmed) return;
    setTimeout(() => this.applicationStore.resign(), this.resignDelayMs);
  }

  handleShuffle(): void {
    this.fooStore.shuffle();
    SoundPlayer.play(Sound.SystemShuffle);
  }

  private async triggerPassDialog() {
    SoundPlayer.play(Sound.SystemDialog);
    return await this.dialogStore.trigger({
      cancelText: window.t('game.dialog_cancel'),
      confirmText: window.t('game.dialog_confirm'),
      html: window.t('game.dialog_html_pass'),
    });
  }

  private async triggerResignDialog() {
    SoundPlayer.play(Sound.SystemDialog);
    return await this.dialogStore.trigger({
      cancelText: window.t('game.dialog_cancel'),
      confirmText: window.t('game.dialog_confirm'),
      html: window.t('game.dialog_html_resign'),
    });
  }
}
