import { GameContext } from '@/application/types.ts';
import { Player } from '@/domain/enums.ts';
import { Placement } from '@/domain/models/Board.ts';

export type PlacementGeneratorWorkerRequest = {
  context: GameContext;
  player: Player;
};

export default class PlacementGeneratorWorker {
  private readonly worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('./script.ts', import.meta.url), { type: 'module' });
  }

  execute(request: PlacementGeneratorWorkerRequest): Promise<Placement | null> {
    return new Promise(resolve => {
      this.worker.onmessage = (event: MessageEvent<{ placement: Placement | null }>) => resolve(event.data.placement);
      this.worker.postMessage(request);
    });
  }

  terminate(): void {
    this.worker.terminate();
  }
}
