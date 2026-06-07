import Turn from '@/domain/entities/Turn.ts';
import { MatchPlayer, MatchResult } from '@/domain/value-objects/enums.ts';
import type { MatchDifficulty, MatchType, TurnValidationError } from '@/domain/value-objects/enums.ts';
import type {
  BoardCell,
  IdentifierGateway,
  InventoryTile,
  MatchSettings,
  TurnValidationResult,
} from '@/domain/value-objects/types.ts';

export default class Match {
  private static readonly FIRST_PLAYER: MatchPlayer = MatchPlayer.User;

  get currentPlayer(): MatchPlayer {
    return this.currentTurn.player;
  }

  get currentTurnCells(): ReadonlyArray<BoardCell> | undefined {
    return this.currentTurn.cells;
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
    return this.currentTurn.tilesView;
  }

  get currentTurnWords(): ReadonlyArray<string> | undefined {
    return this.currentTurn.words;
  }

  get difficulty(): MatchDifficulty {
    return this._settings.difficulty;
  }

  get historyHasPriorTurns(): boolean {
    return this.history.length > 1;
  }

  get isFinished(): boolean {
    for (const result of this.results.values()) if (result !== MatchResult.Undecided) return true;
    return false;
  }

  get nextPlayer(): MatchPlayer {
    if (this.history.length === 0) return Match.FIRST_PLAYER;
    return this.currentPlayer === MatchPlayer.User ? MatchPlayer.Opponent : MatchPlayer.User;
  }

  get opponentScore(): number {
    return this.getScoreFor(MatchPlayer.Opponent);
  }

  get previousTurnTiles(): ReadonlyArray<InventoryTile> | undefined {
    return this.history.at(-2)?.tilesView;
  }

  get settings(): Readonly<MatchSettings> {
    return this._settings;
  }

  get type(): MatchType {
    return this._settings.type;
  }

  get userScore(): number {
    return this.getScoreFor(MatchPlayer.User);
  }

  private get currentTurn(): Turn {
    const last = this.history.at(-1);
    if (last === undefined) throw new ReferenceError('expected current turn, got undefined');
    return last;
  }

  private constructor(
    private readonly identifier: IdentifierGateway | null,
    private readonly results: Map<MatchPlayer, MatchResult>,
    private readonly scores: Map<MatchPlayer, number>,
    private readonly _settings: MatchSettings,
    private readonly history: Array<Turn>,
  ) {}

  static clone(source: Match, identifier: IdentifierGateway | null = null): Match {
    return new Match(
      identifier,
      new Map(source.results),
      new Map(source.scores),
      { ...source._settings },
      source.history.map(turn => Turn.clone(turn)),
    );
  }

  static create(players: ReadonlyArray<MatchPlayer>, settings: MatchSettings, identifier: IdentifierGateway): Match {
    const results = new Map(players.map(player => [player, MatchResult.Undecided]));
    const scores = new Map(players.map(player => [player, 0]));
    return new Match(identifier, results, scores, { ...settings }, []);
  }

  addPlacedTile(tile: InventoryTile): void {
    this.currentTurn.addTile(tile);
  }

  applyDifficultyChange(difficulty: MatchDifficulty): void {
    this.ensureMutability();
    this._settings.difficulty = difficulty;
  }

  getResultFor(player: MatchPlayer): MatchResult {
    const result = this.results.get(player);
    if (result === undefined) throw new ReferenceError(`expected result for player ${player}, got undefined`);
    return result;
  }

  getScoreFor(player: MatchPlayer): number {
    const score = this.scores.get(player);
    if (score === undefined) throw new ReferenceError(`expected score for player ${player}, got undefined`);
    return score;
  }

  incrementScore(player: MatchPlayer, incrementation: number): void {
    if (incrementation < 0) throw new Error(`expected non-negative increment, got ${String(incrementation)}`);
    const currentScore = this.getScoreFor(player);
    const newScore = currentScore + incrementation;
    this.scores.set(player, newScore);
  }

  passCurrentTurn(player: MatchPlayer): void {
    this.ensureMutability();
    this.ensureCurrentPlayer(player);
    this.currentTurn.pass();
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

  recordValidationResult(result: TurnValidationResult): void {
    this.currentTurn.setValidationResult(result);
  }

  removePlacedTile(tile: InventoryTile): void {
    this.currentTurn.removeTile(tile);
  }

  resetCurrentTurn(): void {
    this.currentTurn.reset();
  }

  saveCurrentTurn(player: MatchPlayer): void {
    this.ensureMutability();
    this.ensureCurrentPlayer(player);
    this.currentTurn.save();
  }

  startTurnFor(player: MatchPlayer): void {
    if (this.identifier === null) throw new Error('cannot start turn: identifier is null');
    if (player !== this.nextPlayer) throw new Error(`expected next player to be ${this.nextPlayer}, got ${player}`);
    const newTurn = Turn.create({ identifier: this.identifier, player });
    this.history.push(newTurn);
  }

  willPlayerPassBeResign(player: MatchPlayer): boolean {
    for (let idx = this.history.length - 2; idx >= 0; idx--) {
      const turn = this.history[idx];
      if (turn === undefined) throw new ReferenceError(`expected turn at index ${String(idx)}, got undefined`);
      if (turn.player === player) return turn.wasPassed;
    }
    return false;
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
}
