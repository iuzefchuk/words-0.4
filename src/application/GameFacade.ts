import { TIME } from '@/shared/constants.ts';
import { wait } from '@/shared/helpers.ts';
import { Player } from '@/domain/player/types.ts';
import { Bonus } from '@/domain/board/types.ts';
import { Letter } from '@/domain/tiles/types.ts';
import { Placement } from '@/domain/turn/types.ts';
import Board from '@/domain/board/Board.ts';
import Dictionary from '@/domain/services/Dictionary.ts';
import Layout from '@/domain/board/Layout.ts';
import TilePool from '@/domain/tiles/TilePool.ts';
import TurnDirector from '@/application/TurnDirector.ts';
import PlaceTileCommand from '@/application/commands/PlaceTile.ts';
import UndoPlaceTileCommand from '@/application/commands/UndoPlaceTile.ts';
import SaveTurnCommand from '@/application/commands/SaveTurn.ts';
import PassTurnCommand from '@/application/commands/PassTurn.ts';
import ResignGameCommand from '@/application/commands/ResignGame.ts';
import GameStateQuery from '@/application/queries/GameState.ts';
import MoveGenerator from '@/application/services/generation/MoveGenerator.ts';
import TurnValidator from '@/application/services/validation/TurnValidator.ts';
import { GameCell, GameContext, GameState, GameTile } from '@/application/types.ts';

export default class GameFacade {
  private static readonly layout = Layout.create();
  private static readonly dictionary = Dictionary.create();

  readonly bonuses = Bonus;
  readonly letters = Letter;

  private isMutable: boolean = true;

  private constructor(
    private board: Board,
    private tilePool: TilePool,
    private turnDirector: TurnDirector,
  ) {}

  static start(): GameFacade {
    const players = Object.values(Player);
    const board = Board.create(GameFacade.layout);
    const tilePool = TilePool.create({ players });
    const turnDirector = TurnDirector.create({ players, board });
    return new GameFacade(board, tilePool, turnDirector);
  }

  private get context(): GameContext {
    return {
      board: this.board,
      dictionary: GameFacade.dictionary,
      tilePool: this.tilePool,
      turnDirector: this.turnDirector,
    };
  }

  get layoutCells(): ReadonlyArray<GameCell> {
    return this.board.cells;
  }

  get state(): GameState {
    return GameStateQuery.execute(this.context, this.isMutable);
  }

  isCellInCenterOfLayout(cell: GameCell): boolean {
    return this.board.isCellCenter(cell);
  }

  getCellBonus(cell: GameCell): string | null {
    return this.board.getBonusForCell(cell);
  }

  findTileByCell(cell: GameCell): GameTile | undefined {
    return this.board.findTileByCell(cell);
  }

  findCellByTile(tile: GameTile): GameCell | undefined {
    return this.board.findCellByTile(tile);
  }

  isTileConnected(tile: GameTile): boolean {
    return this.board.isTileConnected(tile);
  }

  areTilesSame(firstTile: GameTile, secondTile: GameTile): boolean {
    return this.tilePool.areTilesEqual(firstTile, secondTile);
  }

  getTileLetter(tile: GameTile): string {
    return this.tilePool.getTileLetter(tile);
  }

  isCellLastConnectionInTurn(cell: GameCell): boolean {
    return this.turnDirector.currentTurnCellSequence?.at(-1) === cell;
  }

  wasTileUsedInPreviousTurn(tile: GameTile): boolean {
    const { previousTurnTileSequence } = this.turnDirector;
    if (!previousTurnTileSequence) return false;
    return previousTurnTileSequence.includes(tile);
  }

  shuffleUserTiles(): void {
    this.ensureMutability();
    this.tilePool.shuffleTilesFor(Player.User);
  }

  placeTile({ cell, tile }: { cell: GameCell; tile: GameTile }): void {
    this.ensureMutability();
    PlaceTileCommand.execute(this.context, { cell, tile });
  }

  undoPlaceTile(tile: GameTile): void {
    this.ensureMutability();
    UndoPlaceTileCommand.execute(this.context, { tile });
  }

  resetTurn(): void {
    this.ensureMutability();
    this.turnDirector.resetCurrentTurn();
  }

  async saveTurn(): Promise<void> {
    this.ensureMutability();
    SaveTurnCommand.execute(this.context);
    if (this.turnDirector.currentPlayer !== Player.User) await this.processOpponentTurn();
  }

  async passTurn(): Promise<void> {
    this.ensureMutability();
    PassTurnCommand.execute(this.context);
    if (this.turnDirector.currentPlayer !== Player.User) await this.processOpponentTurn();
  }

  resignGame(): void {
    this.ensureMutability();
    ResignGameCommand.execute(this.context);
    this.isMutable = false;
  }

  private generatePlacement(player: Player): Placement | null {
    for (const placement of MoveGenerator.execute(this.context, player)) return placement;
    return null;
  }

  private async processOpponentTurn(): Promise<void> {
    await this.setMinimumExecutionTime(() => {
      const generatedPlacement = this.generatePlacement(Player.Opponent);
      if (generatedPlacement === null) {
        PassTurnCommand.execute(this.context);
      } else {
        for (const link of generatedPlacement) this.turnDirector.placeTile({ cell: link.cell, tile: link.tile });
        const result = TurnValidator.execute(this.context, this.turnDirector.currentTurnPlacement);
        this.turnDirector.setCurrentTurnValidation(result);
        SaveTurnCommand.execute(this.context);
      }
    });
  }

  private async setMinimumExecutionTime<T>(
    callback: () => Promise<T> | T,
    delayTimeMs = TIME.ms_in_second,
  ): Promise<T> {
    const startTime = Date.now();
    const result = await callback();
    const elapsed = Date.now() - startTime;
    const delay = delayTimeMs - elapsed;
    if (delay > 0) await wait(delay);
    return result;
  }

  private ensureMutability(): void {
    if (!this.isMutable) throw new Error('Game is immutable');
  }
}
