import { hydrate } from '@/application/services/DataSerializer.ts';
import { GamePlayer, GameTurnGenerator } from '@/application/types/index.ts';

self.onmessage = (e: MessageEvent<{ input: unknown; type: string }>) => {
  try {
    const { data, player } = e.data.input as { data: unknown; player: GamePlayer };
    const context = hydrate(data);
    for (const result of GameTurnGenerator.execute(context, player)) {
      self.postMessage({ type: 'result', value: result });
    }
    self.postMessage({ type: 'done' });
  } catch (error) {
    self.postMessage({ error: String(error), type: 'error' });
  }
};
