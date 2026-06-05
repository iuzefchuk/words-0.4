import type { LoaderGateway, SchedulerGateway, WorkerGateway } from '@/application/types/gateways.ts';
import type { BootProgressPublisher } from '@/application/types/publishers.ts';
import type { EventRepository, SettingsRepository } from '@/application/types/repositories.ts';
import type { IdentifierGateway, RandomizerGateway } from '@/domain/types/gateways.ts';
import type { GameCell } from '@/domain/types/index.ts';

export {
  GameBonus,
  GameEventType,
  GameLetter,
  GameMatchDifficulty,
  GameMatchResult,
  GameMatchType,
  GamePlayer,
} from '@/domain/enums.ts';

export { GameDictionary, GameTurnGenerator } from '@/domain/types/index.ts';

export type {
  GameBoardView,
  GameCell,
  GameDictionaryBuffer,
  GameEvent,
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

export type AppConfig = {
  boardCells: ReadonlyArray<GameCell>;
  boardCellsPerAxis: number;
  tilesPerPlayer: number;
};

export type AppDependencies = {
  config: DependenciesConfig;
  gateways: {
    identifier: IdentifierGateway;
    loader: LoaderGateway;
    randomizer: RandomizerGateway;
    scheduler: SchedulerGateway;
    worker: WorkerGateway;
  };
  publishers: { bootProgress: BootProgressPublisher };
  repositories: { events: EventRepository; settings: SettingsRepository };
  tasks: { turnGeneration: string };
};

export type AppTurnResponse =
  | { readonly error: string; readonly ok: false }
  | { readonly ok: true; readonly value: { words: ReadonlyArray<string> } };

export type DependenciesConfig = {
  dictionaryUrl: string;
};
