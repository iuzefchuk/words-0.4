import AppCommands from '@/app/AppCommands.ts';
import AppQueries from '@/app/AppQueries.ts';
import { AppBootProgress } from '@/app/enums/index.ts';
import { DomainDictionary } from '@/app/types/index.ts';
import DomainGame from '@/domain/aggregates/Game.ts';
import type { AppSchedulerGateway } from '@/app/types/gateways.ts';
import type { AppDependencies } from '@/app/types/index.ts';

export default class App {
  readonly commands: AppCommands;

  readonly queries: AppQueries;

  private readonly scheduler: AppSchedulerGateway;

  private constructor(game: DomainGame, dictionary: DomainDictionary, dependencies: AppDependencies) {
    const { gateways, repositories } = dependencies;
    this.scheduler = gateways.app.scheduler;
    this.queries = new AppQueries(game);
    this.commands = new AppCommands(game, dictionary, gateways.app, repositories);
  }

  static async boot(dependencies: AppDependencies): Promise<App> {
    const {
      config: { dictionaryUrl },
      gateways: {
        app: { loader, turnGenerator },
        domain: domainGateways,
      },
      publishers: { bootProgress },
      repositories,
    } = dependencies;
    bootProgress.publish(AppBootProgress.Started);
    const [buffer, events] = await Promise.all([loader.load(dictionaryUrl), repositories.events.load()]);
    bootProgress.publish(AppBootProgress.DictionaryFetched);
    const dictionary = DomainDictionary.create(new Int32Array(buffer));
    bootProgress.publish(AppBootProgress.DictionaryParsed);
    await turnGenerator.init(buffer);
    const settings = repositories.settings.load();
    const game =
      events !== null && events.length > 0
        ? DomainGame.createFromEvents(events, domainGateways)
        : DomainGame.create(domainGateways, settings);
    bootProgress.publish(AppBootProgress.Finished);
    return new App(game, dictionary, dependencies);
  }

  yield(): Promise<void> {
    return this.scheduler.yield();
  }
}
