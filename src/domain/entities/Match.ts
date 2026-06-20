import Inventory from '@/domain/entities/Inventory.ts';
import Playfield from '@/domain/entities/Playfield.ts';
import Turn from '@/domain/entities/Turn.ts';
import TurnEvaluationService from '@/domain/services/TurnEvaluationService.ts';
import TurnGenerationService from '@/domain/services/TurnGenerationService.ts';
import { MatchPlayer, MatchResult, MatchType, PlayfieldType } from '@/domain/value-objects/enums.ts';
import type { InventoryLetter, PlayfieldBonus, TurnValidationError } from '@/domain/value-objects/enums.ts';
import type {
  Dictionary,
  DictionaryGraph,
  IdentifierGateway,
  InventoryTile,
  InventoryTileCollection,
  MatchSettings,
  PlayfieldAnchorCoordinates,
  PlayfieldCell,
  TurnEvaluation,
  TurnGenerationContext,
  TurnLink,
  TurnPlacement,
} from '@/domain/value-objects/types.ts';

export default class Match {
  private static readonly FIRST_PLAYER: MatchPlayer = MatchPlayer.User;

  get anchorCells(): ReadonlySet<PlayfieldCell> {
    return this.playfield.anchorCells;
  }

  get currentPlayer(): MatchPlayer {
    return this.currentTurn.player;
  }

  get currentTurnError(): TurnValidationError | undefined {
    return this.currentTurn.error;
  }

  get currentTurnIsValid(): boolean {
    return this.currentTurn.isValid;
  }

  get currentTurnScore(): number | undefined {
    return this.currentTurn.score;
  }

  get currentTurnTiles(): ReadonlyArray<InventoryTile> {
    return this.currentTurn.references.map(id => this.playfield.getLinkTile(id));
  }

  get currentTurnWords(): ReadonlyArray<string> | undefined {
    return this.currentTurn.words;
  }

  get historyHasPriorTurns(): boolean {
    return this.history.length > 1;
  }

  get isFinished(): boolean {
    for (const result of this.results.values()) if (result !== MatchResult.Undecided) return true;
    return false;
  }

  get playfieldCells(): ReadonlyArray<PlayfieldCell> {
    return this.playfield.cells;
  }

  get playfieldCellsPerAxis(): number {
    return this.playfield.cellsPerAxis;
  }

  get nextPlayer(): MatchPlayer {
    if (this.history.length === 0) return Match.FIRST_PLAYER;
    return this.currentPlayer === MatchPlayer.User ? MatchPlayer.Opponent : MatchPlayer.User;
  }

  get previousTurnTiles(): ReadonlyArray<InventoryTile> | undefined {
    const previousTurn = this.history.at(-2);
    if (previousTurn === undefined) return undefined;
    return previousTurn.references.map(id => this.playfield.getLinkTile(id));
  }

  get tilesPerPlayer(): number {
    return this.inventory.tilesPerPlayer;
  }

  get unusedTilesCount(): number {
    return this.inventory.unusedTilesCount;
  }

  private get currentTurn(): Turn {
    const last = this.history.at(-1);
    if (last === undefined) throw new ReferenceError('expected current turn, got undefined');
    return last;
  }

  private constructor(
    private readonly identifier: IdentifierGateway | null,
    private readonly inventory: Inventory,
    private readonly playfield: Playfield,
    private readonly results: Map<MatchPlayer, MatchResult>,
    readonly settings: MatchSettings,
    private readonly history: Array<Turn>,
  ) {}

  static clone(source: Match, identifier: IdentifierGateway | null = null): Match {
    const currentTurn = source.history.at(-1);
    if (currentTurn === undefined) throw new ReferenceError('expected current turn, got undefined');
    return new Match(
      identifier,
      Inventory.clone(source.inventory),
      Playfield.clone(source.playfield, identifier),
      new Map(source.results),
      { ...source.settings },
      [...source.history.slice(0, -1), Turn.clone(currentTurn)],
    );
  }

  static create(
    players: ReadonlyArray<MatchPlayer>,
    settings: MatchSettings,
    identifier: IdentifierGateway,
    randomizerFunction: () => number,
  ): Match {
    const inventory = Inventory.create(players, randomizerFunction);
    const playfieldType = Match.mapMatchTypeToPlayfieldType(settings.type);
    const playfield = Playfield.create(playfieldType, identifier, randomizerFunction);
    const results = new Map(players.map(player => [player, MatchResult.Undecided]));
    return new Match(identifier, inventory, playfield, results, { ...settings }, []);
  }

  private static mapMatchTypeToPlayfieldType(matchType: MatchType): PlayfieldType {
    return {
      [MatchType.Classic]: PlayfieldType.Preset,
      [MatchType.Random]: PlayfieldType.Random,
    }[matchType];
  }

  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean {
    return this.inventory.areTilesEqual(firstTile, secondTile);
  }

  buildPlacement(coords: PlayfieldAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>): TurnPlacement {
    return this.playfield.buildPlacement(coords, tiles);
  }

  createTurnGenerationContext(dictionary: DictionaryGraph): TurnGenerationContext {
    return TurnGenerationService.createContext(this, dictionary);
  }

  discardTile(player: MatchPlayer, tile: InventoryTile): void {
    this.inventory.discardTile({ player, tile });
  }

  evaluateTurn(dictionary: Dictionary): TurnEvaluation {
    return TurnEvaluationService.execute({ dictionary, match: this });
  }

  findCellByTile(tile: InventoryTile): PlayfieldCell | undefined {
    return this.playfield.findCellByTile(tile);
  }

  findTileByCell(cell: PlayfieldCell): InventoryTile | undefined {
    return this.playfield.findTileByCell(cell);
  }

  getCellBonus(cell: PlayfieldCell): null | PlayfieldBonus {
    return this.playfield.getBonus(cell);
  }

  getLetterPoints(letter: InventoryLetter): number {
    return this.inventory.getLetterPoints(letter);
  }

  getMultiplierForLetter(cell: PlayfieldCell): number {
    return this.playfield.getMultiplierForLetter(cell);
  }

  getMultiplierForWord(cell: PlayfieldCell): number {
    return this.playfield.getMultiplierForWord(cell);
  }

  getResultFor(player: MatchPlayer): MatchResult {
    const result = this.results.get(player);
    if (result === undefined) throw new ReferenceError(`expected result for player ${player}, got undefined`);
    return result;
  }

  getScoreFor(player: MatchPlayer): number {
    let total = 0;
    for (const turn of this.history) {
      if (turn.player === player && turn.score !== undefined) total += turn.score;
    }
    return total;
  }

  getTileCollectionFor(player: MatchPlayer): InventoryTileCollection {
    return this.inventory.getTileCollectionFor(player);
  }

  getTileLetter(tile: InventoryTile): InventoryLetter {
    return this.inventory.getTileLetter(tile);
  }

  getTilePoints(tile: InventoryTile): number {
    return this.inventory.getTilePoints(tile);
  }

  getTilesFor(player: MatchPlayer): ReadonlyArray<InventoryTile> {
    return this.inventory.getTilesFor(player);
  }

  hasTilesFor(player: MatchPlayer): boolean {
    return this.inventory.hasTilesFor(player);
  }

  isCellOccupied(cell: PlayfieldCell): boolean {
    return this.playfield.isCellOccupied(cell);
  }

  isTilePlaced(tile: InventoryTile): boolean {
    return this.playfield.isTilePlaced(tile);
  }

  passCurrentTurn(player: MatchPlayer): void {
    this.ensureMutability();
    this.ensureCurrentPlayer(player);
    this.currentTurn.setStatusPass();
  }

  placeTile(cell: PlayfieldCell, tile: InventoryTile): void {
    const linkId = this.playfield.placeTile(cell, tile);
    this.currentTurn.addReference(linkId);
  }

  resolvePlacement(tiles: ReadonlyArray<InventoryTile>): ReadonlyArray<TurnLink> {
    return this.playfield.resolvePlacement(tiles);
  }

  recordCompletion(winner: MatchPlayer, loser: MatchPlayer): void {
    this.ensureMutability();
    this.recordResult(winner, MatchResult.Win);
    this.recordResult(loser, MatchResult.Lose);
  }

  recordTie(firstPlayer: MatchPlayer, secondPlayer: MatchPlayer): void {
    this.ensureMutability();
    this.recordResult(firstPlayer, MatchResult.Tie);
    this.recordResult(secondPlayer, MatchResult.Tie);
  }

  recordValidationResult(result: TurnEvaluation): void {
    this.currentTurn.setEvaluation(result);
  }

  replenishTilesFor(player: MatchPlayer): void {
    this.inventory.replenishTilesFor(player);
  }

  resetCurrentTurn(): void {
    for (const linkId of this.currentTurn.references) {
      this.playfield.undoPlaceTile(this.playfield.getLinkTile(linkId));
    }
    this.replaceTurn(this.currentTurn.player);
  }

  saveCurrentTurn(player: MatchPlayer): void {
    this.ensureMutability();
    this.ensureCurrentPlayer(player);
    this.currentTurn.setStatusSave();
  }

  shuffleTilesFor(player: MatchPlayer): void {
    this.inventory.shuffleTilesFor(player);
  }

  startTurnFor(player: MatchPlayer): void {
    if (player !== this.nextPlayer) throw new Error(`expected next player to be ${this.nextPlayer}, got ${player}`);
    this.history.push(this.createTurn(player));
  }

  undoPlaceTile(tile: InventoryTile): void {
    const linkId = this.playfield.undoPlaceTile(tile);
    this.currentTurn.removeReference(linkId);
  }

  willPlayerPassBeResign(player: MatchPlayer): boolean {
    for (let idx = this.history.length - 2; idx >= 0; idx--) {
      const turn = this.history[idx];
      if (turn === undefined) throw new ReferenceError(`expected turn at index ${String(idx)}, got undefined`);
      if (turn.player === player) return turn.hasStatusPass;
    }
    return false;
  }

  private createTurn(player: MatchPlayer): Turn {
    if (this.identifier === null) throw new Error('cannot create turn: identifier is null');
    return Turn.create({ identifier: this.identifier, player });
  }

  private ensureCurrentPlayer(player: MatchPlayer): void {
    if (player !== this.currentPlayer) throw new Error(`expected current player to be ${this.currentPlayer}, got ${player}`);
  }

  private ensureMutability(): void {
    if (this.isFinished) throw new Error('cannot mutate finished match');
  }

  private recordResult(player: MatchPlayer, result: MatchResult): void {
    this.results.set(player, result);
  }

  private replaceTurn(player: MatchPlayer): void {
    this.history.pop();
    this.history.push(this.createTurn(player));
  }
}
