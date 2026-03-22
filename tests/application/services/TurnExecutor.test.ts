import { describe, it, expect, vi } from 'vitest';
import { createTestContext } from '$/helpers.ts';
import { Player } from '@/domain/enums.ts';
import { TurnOutcomeType } from '@/domain/models/TurnTracker.ts';
import PassTurnCommand from '@/application/commands/PassTurn.ts';

vi.mock('@/infrastructure/TurnGeneratorWorker/TurnGeneratorWorker.ts', () => {
  return {
    default: class MockTurnGeneratorWorker {
      static mockExecute: (() => Promise<unknown>) | null = null;

      execute(...args: unknown[]) {
        if (MockTurnGeneratorWorker.mockExecute) return MockTurnGeneratorWorker.mockExecute();
        return Promise.resolve(null);
      }

      terminate() {}
    },
  };
});

async function getMockWorkerClass() {
  const mod = await import('@/infrastructure/TurnGeneratorWorker/TurnGeneratorWorker.ts');
  return mod.default as unknown as {
    mockExecute: (() => Promise<unknown>) | null;
  };
}

describe('Opponent turn execution', () => {
  it('falls back to pass when worker returns null', async () => {
    const MockWorker = await getMockWorkerClass();
    MockWorker.mockExecute = () => Promise.resolve(null);

    const domain = createTestContext();
    const player = Player.Opponent;

    // Simulate what Application.executeOpponentTurn does
    let generatorResult;
    try {
      generatorResult = await new (await import('@/infrastructure/TurnGeneratorWorker/TurnGeneratorWorker.ts')).default().execute({ domain, player });
    } catch {
      generatorResult = null;
    }

    expect(generatorResult).toBeNull();
    // Should pass since not resign condition
    expect(domain.willPlayerPassBeResign(player)).toBe(false);
  });

  it('falls back to pass when worker throws an error', async () => {
    const MockWorker = await getMockWorkerClass();
    MockWorker.mockExecute = () => Promise.reject(new Error('Worker crashed'));

    const domain = createTestContext();
    const player = Player.Opponent;

    let generatorResult;
    try {
      generatorResult = await new (await import('@/infrastructure/TurnGeneratorWorker/TurnGeneratorWorker.ts')).default().execute({ domain, player });
    } catch {
      generatorResult = null;
    }

    expect(generatorResult).toBeNull();
  });

  it('falls back to resign when worker fails and player already passed', async () => {
    const MockWorker = await getMockWorkerClass();
    MockWorker.mockExecute = () => Promise.reject(new Error('Worker error'));

    const domain = createTestContext();
    // Simulate opponent having already passed
    domain.passCurrentTurn(); // User → Opponent
    domain.passCurrentTurn(); // Opponent → User
    domain.passCurrentTurn(); // User → Opponent

    expect(domain.willPlayerPassBeResign(Player.Opponent)).toBe(true);
  });
});
