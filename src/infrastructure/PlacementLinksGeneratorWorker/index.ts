import { GameContext } from '@/application/types.ts';
import { Player } from '@/domain/enums.ts';
import { PlacementLinks } from '@/domain/models/TurnHistory.ts';

export type PlacementLinksGeneratorWorkerRequest = {
  context: GameContext;
  player: Player;
};

export default class PlacementLinksGeneratorWorker {
  private readonly worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('./script.ts', import.meta.url), { type: 'module' });
  }

  execute(request: PlacementLinksGeneratorWorkerRequest): Promise<PlacementLinks | null> {
    return new Promise(resolve => {
      this.worker.onmessage = (event: MessageEvent<{ placementLinks: PlacementLinks | null }>) =>
        resolve(event.data.placementLinks);
      this.worker.postMessage(request);
    });
  }

  terminate(): void {
    this.worker.terminate();
  }
}
