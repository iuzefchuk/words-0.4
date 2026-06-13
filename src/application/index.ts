import { BootProgress } from '@/application/enums.ts';
import CommandsService from '@/application/services/CommandsService.ts';
import QueriesService from '@/application/services/QueriesService.ts';
import { GameDictionary } from '@/application/types/index.ts';
import Game from '@/domain/Game.ts';
import type { SchedulerGateway } from '@/application/types/gateways.ts';
import type { AppConfig, AppDependencies, GameEvent, GameMatchSettings } from '@/application/types/index.ts';

export default class Application {
  get config(): AppConfig {
    return {
      boardCells: this.game.boardView.cells,
      boardCellsPerAxis: this.game.boardView.cellsPerAxis,
      tilesPerPlayer: this.game.inventoryView.tilesPerPlayer,
    };
  }

  get scheduler(): SchedulerGateway {
    return this.dependencies.gateways.scheduler;
  }

  private constructor(
    private readonly game: Game,
    private readonly dependencies: AppDependencies,
    readonly commandsService: CommandsService,
    readonly queriesService: QueriesService,
  ) {}

  static async create(dependencies: AppDependencies): Promise<Application> {
    const { gateways, repositories, tasks } = dependencies;
    const events = await repositories.events.load();
    const settings = repositories.settings.load();
    const game = this.createGameInstance(gateways, events, settings);
    const queriesService = new QueriesService(game);
    const commandsService = new CommandsService(
      game,
      gateways.scheduler,
      gateways.worker,
      tasks.turnGeneration,
      repositories.events,
      repositories.settings,
    );
    return new Application(game, dependencies, commandsService, queriesService);
  }

  private static createGameInstance(
    gateways: AppDependencies['gateways'],
    events: null | ReadonlyArray<GameEvent>,
    settings: null | Partial<GameMatchSettings>,
  ): Game {
    return events !== null && events.length > 0
      ? Game.createFromEvents(events, gateways.identifier, gateways.randomizer)
      : Game.create(gateways.identifier, gateways.randomizer, settings);
  }

  async bootDictionary(): Promise<void> {
    const { config, gateways, publishers, tasks } = this.dependencies;
    publishers.bootProgress.publish(BootProgress.Started);
    gateways.worker.spawnPool(tasks.turnGeneration);
    const buffer = await gateways.loader.load(config.dictionaryUrl);
    publishers.bootProgress.publish(BootProgress.DictionaryFetched);
    this.game.setDictionary(GameDictionary.createFromBuffer(buffer));
    publishers.bootProgress.publish(BootProgress.DictionaryParsed);
    void gateways.worker.init(tasks.turnGeneration, buffer);
    publishers.bootProgress.publish(BootProgress.Finished);
  }
}
