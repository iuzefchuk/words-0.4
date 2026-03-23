import { AppTurnExecutionResult } from '@/application/types.ts';
import { Domain } from '@/domain/types.ts';

export default class SaveTurnCommand {
  static execute(domain: Domain): AppTurnExecutionResult {
    if (!domain.currentTurnIsValid) return { ok: false, error: 'Turn is not valid' };
    const { words } = domain.saveCurrentTurn();
    return { ok: true, value: { words } };
  }
}
