import PlacementLinksGenerator from '@/application/services/PlacementLinksGenerator.ts';
import TurnDirector from '@/application/TurnDirector.ts';
import Board from '@/domain/models/Board.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import Inventory from '@/domain/models/Inventory.ts';
import { PlacementLinksGeneratorWorkerRequest } from './index.ts';

self.onmessage = (event: MessageEvent<PlacementLinksGeneratorWorkerRequest>) => {
  const { context, player } = event.data;
  Board.hydrate(context.board);
  Dictionary.hydrate(context.dictionary);
  Inventory.hydrate(context.inventory);
  TurnDirector.hydrate(context.turnDirector);
  for (const placementLinks of PlacementLinksGenerator.execute(context, player)) {
    self.postMessage({ placementLinks });
    return;
  }
  self.postMessage({ placementLinks: null });
};
