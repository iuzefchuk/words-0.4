import AppCommands from '@/app/AppCommands.ts';
import AppQueries from '@/app/AppQueries.ts';
import { AppBootProgress } from '@/app/enums.ts';
import { GameDictionary } from '@/app/types/index.ts';
import Game from '@/domain/Game.ts';
import type { AppSchedulerGateway } from '@/app/types/gateways.ts';
import type { AppDependencies } from '@/app/types/index.ts';

export default class App {
  get scheduler(): AppSchedulerGateway {
    return this.dependencies.gateways.app.scheduler;
  }

  private constructor(
    private readonly game: Game,
    private readonly dependencies: AppDependencies,
    readonly commands: AppCommands,
    readonly queries: AppQueries,
  ) {}

  static async create(dependencies: AppDependencies): Promise<App> {
    const { gateways, repositories } = dependencies;
    const events = await repositories.events.load();
    const settings = repositories.settings.load();
    const game =
      events !== null && events.length > 0 ? Game.createFromEvents(events, gateways.game) : Game.create(gateways.game, settings);
    const queries = new AppQueries(game);
    const commands = new AppCommands(game, gateways.app.scheduler, gateways.app.turnGenerator, repositories);
    return new App(game, dependencies, commands, queries);
  }

  async boot(): Promise<void> {
    const { config, gateways, publishers } = this.dependencies;
    publishers.bootProgress.publish(AppBootProgress.Started);
    const buffer = await gateways.app.loader.load(config.dictionaryUrl);
    publishers.bootProgress.publish(AppBootProgress.DictionaryFetched);
    this.game.setDictionary(GameDictionary.createFromBuffer(buffer));
    publishers.bootProgress.publish(AppBootProgress.DictionaryParsed);
    await gateways.app.turnGenerator.init(buffer);
    publishers.bootProgress.publish(AppBootProgress.Finished);
  }
}
