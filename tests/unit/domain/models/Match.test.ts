import { Player } from '@/domain/enums.ts';
import Match, { MatchResult } from '@/domain/models/Match.ts';

describe('Match', () => {
  describe('initial config', () => {
    let match: Match;

    it('should start with scores at 0', () => {
      expect(match.getScoreFor(Player.User)).toBe(0);
      expect(match.getScoreFor(Player.Opponent)).toBe(0);
    });

    it('should have no results', () => {
      expect(match.getResultFor(Player.User)).toBeUndefined();
      expect(match.getResultFor(Player.Opponent)).toBeUndefined();
    });

    it('should not be marked as finished', () => {
      expect(match.isFinished).toBe(false);
    });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });

  describe('scoring system', () => {
    let match: Match;

    it('should update score when incrementing', () => {
      match.incrementScore(Player.User, 10);
      match.incrementScore(Player.Opponent, 15);
      expect(match.getScoreFor(Player.User)).toBe(10);
      expect(match.getScoreFor(Player.Opponent)).toBe(15);
    });

    it('should forbid negative incrementation', () => {
      expect(() => match.incrementScore(Player.User, -5)).toThrow();
    });

    it('should accumulate multiple increments', () => {
      match.incrementScore(Player.User, 10);
      match.incrementScore(Player.User, 20);
      expect(match.getScoreFor(Player.User)).toBe(30);
    });

    it('should return score via getters', () => {
      match.incrementScore(Player.User, 42);
      match.incrementScore(Player.Opponent, 33);
      expect(match.userScore).toBe(42);
      expect(match.opponentScore).toBe(33);
    });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });

  describe('rankings by score', () => {
    let match: Match;

    it('should return correct values on user lead', () => {
      match.incrementScore(Player.User, 10);
      match.incrementScore(Player.Opponent, 5);
      expect(match.leaderByScore).toBe(Player.User);
      expect(match.loserByScore).toBe(Player.Opponent);
    });

    it('should return correct values on opponent lead', () => {
      match.incrementScore(Player.User, 5);
      match.incrementScore(Player.Opponent, 10);
      expect(match.leaderByScore).toBe(Player.Opponent);
      expect(match.loserByScore).toBe(Player.User);
    });

    it('should return nulls when scores are tied', () => {
      match.incrementScore(Player.User, 5);
      match.incrementScore(Player.Opponent, 5);
      expect(match.leaderByScore).toBeNull();
      expect(match.loserByScore).toBeNull();
    });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });

  describe('completion', () => {
    let match: Match;

    it('should record winners and losers correctly', () => {
      match.recordCompletion(Player.User, Player.Opponent);
      expect(match.getResultFor(Player.User)).toBe(MatchResult.Win);
      expect(match.getResultFor(Player.Opponent)).toBe(MatchResult.Lose);
    });

    it('should mark match as finished', () => {
      match.recordCompletion(Player.User, Player.Opponent);
      expect(match.isFinished).toBe(true);
    });

    it('should forbid completion if match finished', () => {
      match.recordCompletion(Player.User, Player.Opponent);
      expect(() => match.recordCompletion(Player.Opponent, Player.User)).toThrow();
    });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });

  describe('tie', () => {
    let match: Match;

    it('should record tie correctly', () => {
      match.recordTie(Player.User, Player.Opponent);
      expect(match.getResultFor(Player.User)).toBe(MatchResult.Tie);
      expect(match.getResultFor(Player.Opponent)).toBe(MatchResult.Tie);
    });

    it('should mark match as finished', () => {
      match.recordTie(Player.User, Player.Opponent);
      expect(match.isFinished).toBe(true);
    });

    it('should forbid recording tie if match finished', () => {
      match.recordTie(Player.User, Player.Opponent);
      expect(() => match.recordTie(Player.User, Player.Opponent)).toThrow();
    });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });

  describe('snapshoting', () => {
    let match: Match;

    it('should capture scores in snapshot', () => {
      // TODO expand
      match.incrementScore(Player.User, 25);
      match.incrementScore(Player.Opponent, 50);
      const { scores } = match.snapshot;
      expect(scores.get(Player.User)).toBe(25);
      expect(scores.get(Player.Opponent)).toBe(50);
    });

    it('should capture results in snapshot', () => {
      // TODO expand
      match.recordCompletion(Player.User, Player.Opponent);
      const { results } = match.snapshot;
      expect(results.get(Player.User)).toBe(MatchResult.Win);
      expect(results.get(Player.Opponent)).toBe(MatchResult.Lose);
    });

    // it('should preserve state when restoring from snapshot', () => {
    //   match.incrementScore(Player.User, 25);
    //   match.incrementScore(Player.Opponent, 50);
    //   match.recordCompletion(Player.Opponent, Player.User);
    //   const restoredMatch = Match.restoreFromSnapshot(match.snapshot);
    //   expect(restoredMatch.getScoreFor(Player.User)).toBe(25);
    //   expect(restoredMatch.getScoreFor(Player.Opponent)).toBe(50);
    //   expect(restoredMatch.getResultFor(Player.User)).toBe(MatchResult.Lose);
    //   expect(restoredMatch.getResultFor(Player.Opponent)).toBe(MatchResult.Win);
    // });

    // it('should preserve state through snapshot round-trip', () => {
    //   match.incrementScore(Player.User, 10);
    //   const restoredMatch = Match.restoreFromSnapshot(match.snapshot);
    //   expect(restoredMatch.userScore).toBe(match.userScore);
    //   expect(restoredMatch.opponentScore).toBe(match.opponentScore);
    //   expect(restoredMatch.isFinished).toBe(match.isFinished);
    // });

    beforeEach(() => {
      match = Match.create([Player.User, Player.Opponent]);
    });
  });
});
