import type { AppGateways } from '@/app/types/gateways.ts';
import type { AppPublishers } from '@/app/types/publishers.ts';
import type { AppRepositories } from '@/app/types/repositories.ts';
import type { GameGateways } from '@/domain/types/gateways.ts';

export type AppConfig = {
  dictionaryUrl: string;
};

export type AppDependencies = {
  config: AppConfig;
  gateways: { app: AppGateways; game: GameGateways };
  publishers: AppPublishers;
  repositories: AppRepositories;
};

export type AppTurnResponse =
  | { readonly error: string; readonly ok: false }
  | { readonly ok: true; readonly value: { words: ReadonlyArray<string> } };

export {
  GameBonus,
  GameEventType,
  GameLetter,
  GameMatchDifficulty,
  GameMatchResult,
  GameMatchType,
  GamePlayer,
} from '@/domain/enums.ts';

export type { GameGateways, GameIdentifierGateway, GameRandomizerGateway } from '@/domain/types/gateways.ts';

export type {
  GameBoardView,
  GameCell,
  GameDictionaryBuffer,
  GameEvent,
  GameGeneratorContext,
  GameGeneratorContextData,
  GameGeneratorPartition,
  GameGeneratorResult,
  GameInventoryView,
  GameMatchSettings,
  GameMatchView,
  GameNode,
  GameTile,
  GameTurnsView,
} from '@/domain/types/index.ts';

export { GameDictionary, GameTurnGenerator } from '@/domain/types/index.ts';
