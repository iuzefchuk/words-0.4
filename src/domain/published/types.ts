import { default as DomainTurnGenerator } from '@/domain/services/TurnGenerationService.ts';
import { default as DomainDictionary } from '@/domain/value-objects/classes/Dictionary.ts';

export type {
  BoardCell as DomainBoardCell,
  BoardProjection as DomainBoardProjection,
  DictionaryGraph as DomainDictionaryGraph,
  Gateways as DomainGateways,
  IdentifierGateway as DomainIdentifierGateway,
  InventoryProjection as DomainInventoryProjection,
  InventoryTile as DomainInventoryTile,
  MatchProjection as DomainMatchProjection,
  MatchSettings as DomainMatchSettings,
  RandomizerGateway as DomainRandomizerGateway,
  TimelineEvent as DomainTimelineEvent,
  TurnGenerationContext as DomainTurnGenerationContext,
  TurnGenerationContextData as DomainTurnGenerationContextData,
  TurnGenerationPartition as DomainTurnGenerationPartition,
  TurnGenerationResult as DomainTurnGenerationResult,
  Dictionary as DomainWordDictionary,
} from '@/domain/value-objects/types.ts';

export { DomainDictionary, DomainTurnGenerator };
