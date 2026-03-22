import TurnGenerator from '@/domain/services/TurnGenerator.ts';
import Domain from '@/domain/index.ts';
import { TurnGeneratorWorkerRequest } from './TurnGeneratorWorker.ts';

self.onmessage = (event: MessageEvent<TurnGeneratorWorkerRequest>) => {
  try {
    const { domain, player } = event.data;
    if (!domain || !player) {
      throw new Error('Invalid worker request: missing domain or player');
    }
    const hydrated = Domain.hydrate(domain);
    for (const result of TurnGenerator.execute(hydrated.toGeneratorContext(), player)) return self.postMessage({ return: result });
    self.postMessage({ return: null });
  } catch (error) {
    self.postMessage({ return: null, error: error instanceof Error ? error.message : String(error) });
  }
};
