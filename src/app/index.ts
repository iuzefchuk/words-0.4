import { BootProgress } from '@/app/enums.ts';
import CommandsService from '@/app/services/CommandsService.ts';
import QueriesService from '@/app/services/QueriesService.ts';
import { GameDictionary } from '@/app/types/index.ts';
import Game from '@/domain/Game.ts';
import type { SchedulerGateway } from '@/app/types/gateways.ts';
import type { AppDependencies, GameConfig, GameEvent, GameGateways, GameMatchSettings } from '@/app/types/index.ts';

export default class App {
  get config(): GameConfig {
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

  static async create(dependencies: AppDependencies): Promise<App> {
    const { gateways, repositories, tasks } = dependencies;
    const events = await repositories.events.load();
    const settings = repositories.settings.load();
    const game = this.createGame(gateways, events, settings);
    const queriesService = new QueriesService(game);
    const commandsService = new CommandsService(
      game,
      gateways.scheduler,
      gateways.worker,
      tasks.turnGeneration,
      repositories.events,
      repositories.settings,
    );
    return new App(game, dependencies, commandsService, queriesService);
  }

  private static createGame(
    gateways: GameGateways,
    events: null | ReadonlyArray<GameEvent>,
    settings: null | Partial<GameMatchSettings>,
  ): Game {
    return events !== null && events.length > 0 ? Game.createFromEvents(events, gateways) : Game.create(gateways, settings);
  }

  async bootDictionary(): Promise<void> {
    const { config, gateways, publishers, tasks } = this.dependencies;
    publishers.bootProgress.publish(BootProgress.Started);
    const buffer = await gateways.loader.load(config.dictionaryUrl);
    publishers.bootProgress.publish(BootProgress.DictionaryFetched);
    this.game.setDictionary(GameDictionary.createFromBuffer(buffer));
    publishers.bootProgress.publish(BootProgress.DictionaryParsed);
    await gateways.worker.init(tasks.turnGeneration, buffer);
    publishers.bootProgress.publish(BootProgress.Finished);
  }
}
