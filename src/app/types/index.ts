import type { AppGateways } from '@/app/types/gateways.ts';
import type { AppPublishers } from '@/app/types/publishers.ts';
import type { AppRepositories } from '@/app/types/repositories.ts';
import type { DomainGateways } from '@/domain/published/types.ts';

export type AppConfig = {
  dictionaryUrl: string;
};

export type AppDependencies = {
  config: AppConfig;
  gateways: { app: AppGateways; domain: DomainGateways };
  publishers: AppPublishers;
  repositories: AppRepositories;
};

export type AppTurnResponse =
  | { readonly error: string; readonly ok: false }
  | { readonly ok: true; readonly value: { words: ReadonlyArray<string> } };

export type {
  DomainDictionaryGraph,
  DomainGateways,
  DomainIdentifierGateway,
  DomainInventoryTile,
  DomainMatchProjection,
  DomainMatchSettings,
  DomainPlayfieldCell,
  DomainRandomizerGateway,
  DomainTimelineEvent,
  DomainTimelineProjection,
  DomainTurnGenerationContext,
  DomainTurnGenerationContextData,
  DomainTurnGenerationPartition,
  DomainTurnGenerationResult,
  DomainWordDictionary,
} from '@/domain/published/types.ts';

export { DomainDictionary, DomainPlayfield, DomainTurnGenerator } from '@/domain/published/types.ts';
