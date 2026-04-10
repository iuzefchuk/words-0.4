import { Player } from '@/domain/enums.ts';
import { MatchResult } from '@/domain/models/match/enums.ts';

export default class Match {
  get isFinished(): boolean {
    return [...this.results.values()].some(Boolean);
  }

  get leaderByScore(): null | Player {
    const scoresAreTied = this.userScore === this.opponentScore;
    if (scoresAreTied) return null;
    return this.userScore > this.opponentScore ? Player.User : Player.Opponent;
  }

  get loserByScore(): null | Player {
    if (this.leaderByScore === null) return null;
    return this.leaderByScore === Player.User ? Player.Opponent : Player.User;
  }

  get opponentScore(): number {
    return this.getScoreFor(Player.Opponent);
  }

  get userScore(): number {
    return this.getScoreFor(Player.User);
  }

  private constructor(
    private results: Map<Player, MatchResult | undefined>,
    private scores: Map<Player, number>,
  ) {}

  static create(players: ReadonlyArray<Player>): Match {
    const results = new Map(players.map(player => [player, undefined]));
    const scores = new Map(players.map(player => [player, 0]));
    return new Match(results, scores);
  }

  getResultFor(player: Player): MatchResult | undefined {
    return this.results.get(player);
  }

  getScoreFor(player: Player): number {
    const score = this.scores.get(player);
    if (score === undefined) throw new ReferenceError('Score for player must be defined');
    return score;
  }

  incrementScore(player: Player, incrementation: number): void {
    if (incrementation < 0) throw new Error('Score incrementation must be positive');
    const currentScore = this.getScoreFor(player);
    const newScore = currentScore + incrementation;
    this.scores.set(player, newScore);
  }

  recordCompletion(winner: Player, loser: Player): void {
    this.ensureMutability();
    this.recordResult(winner, MatchResult.Win);
    this.recordResult(loser, MatchResult.Lose);
  }

  recordTie(firstPlayer: Player, secondPlayer: Player): void {
    this.ensureMutability();
    this.recordResult(firstPlayer, MatchResult.Tie);
    this.recordResult(secondPlayer, MatchResult.Tie);
  }

  private ensureMutability(): void {
    if (this.isFinished) throw new Error('Match is finished');
  }

  private recordResult(player: Player, result: MatchResult): void {
    this.results.set(player, result);
  }
}
