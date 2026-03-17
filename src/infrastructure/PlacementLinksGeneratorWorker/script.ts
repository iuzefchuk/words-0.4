import PlacementLinksGenerator from '@/application/services/PlacementLinksGenerator.ts';
import { PlacementLinksGeneratorWorkerRequest } from './index.ts';

self.onmessage = (event: MessageEvent<PlacementLinksGeneratorWorkerRequest>) => {
  const { context, player } = event.data;
  for (const placementLinks of PlacementLinksGenerator.execute(context, player)) self.postMessage({ placementLinks });
  self.postMessage({ placementLinks: null });
};
