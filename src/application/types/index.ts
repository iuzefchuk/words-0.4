import { FileService, SchedulingService, WorkerService } from '@/application/types/ports.ts';
import { EventRepository, SettingsRepository } from '@/application/types/repositories.ts';
import { GameCell } from '@/domain/types/index.ts';
import { IdentityService, SeedingService } from '@/domain/types/ports.ts';

export {
  GameBoardType,
  GameBonus,
  GameDictionary,
  GameDifficulty,
  GameEventType,
  GameLetter,
  GameMatchResult,
  GamePlayer,
  GameTurnGenerator,
} from '@/domain/types/index.ts';

export type {
  GameBoardView,
  GameCell,
  GameEvent,
  GameGeneratorContextData,
  GameGeneratorPartition,
  GameGeneratorResult,
  GameInventoryView,
  GameMatchView,
  GameNode,
  GameSettings,
  GameTile,
  GameTurnsView,
} from '@/domain/types/index.ts';

export type AppConfig = {
  boardCells: ReadonlyArray<GameCell>;
  boardCellsPerAxis: number;
  tilesPerPlayer: number;
};

export type AppConfigValues = {
  dictionaryUrl: string;
};

export type AppDependencies = {
  config: AppConfigValues;
  repositories: { events: EventRepository; settings: SettingsRepository };
  services: {
    file: FileService;
    identity: IdentityService;
    scheduling: SchedulingService;
    seeding: SeedingService;
    worker: WorkerService;
  };
  tasks: { turnGeneration: string };
};

export type AppTurnResponse = Result<{ words: ReadonlyArray<string> }, string>;
