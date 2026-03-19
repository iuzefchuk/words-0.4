import TurnGenerator from '@/application/services/TurnGenerator.ts';
import TurnDirector from '@/application/TurnDirector.ts';
import Board from '@/domain/models/Board.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import Inventory from '@/domain/models/Inventory.ts';
import { PlacementGeneratorWorkerRequest } from './index.ts';

self.onmessage = (event: MessageEvent<PlacementGeneratorWorkerRequest>) => {
  const { context, player } = event.data;
  Board.hydrate(context.board);
  Dictionary.hydrate(context.dictionary);
  Inventory.hydrate(context.inventory);
  TurnDirector.hydrate(context.turnDirector);
  for (const placement of TurnGenerator.execute(context, player)) {
    self.postMessage({ placement });
    return;
  }
  self.postMessage({ placement: null });
};
