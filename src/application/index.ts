import AppCommandBuilder from '@/application/commands.ts';
import AppQueryBuilder from '@/application/queries.ts';
import { AppCommands, AppConfig, AppQueries, GameDictionary, GameSettings } from '@/application/types.ts';
import Game from '@/domain/Game.ts';
import { DictionaryRepository, GameRepository, IdGenerator } from '@/domain/types.ts';
import Infrastructure from '@/infrastructure/index.ts';

export default class Application {
  get commands(): AppCommands {
    return this.commandBuilder.commands;
  }

  get config(): AppConfig {
    return {
      boardCells: this.game.boardView.cells,
      boardCellsPerAxis: this.game.boardView.cellsPerAxis,
    };
  }

  get queries(): AppQueries {
    return this.queryBuilder.queries;
  }

  private constructor(
    private readonly queryBuilder: AppQueryBuilder,
    private readonly commandBuilder: AppCommandBuilder,
    private readonly game: Game,
  ) {}

  static async create(settings: GameSettings): Promise<Application> {
    const { clock, idGenerator, repositories, scheduler } = await Infrastructure.createAppDependencies();
    const game = await this.fetchGameInstance(idGenerator, repositories, settings);
    const queryBuilder = new AppQueryBuilder(game);
    const commandBuilder = new AppCommandBuilder(game, clock, idGenerator, scheduler, repositories.game);
    return new Application(queryBuilder, commandBuilder, game);
  }

  private static async fetchDictionary(repository: DictionaryRepository): Promise<GameDictionary> {
    const snapshot = await repository.load();
    if (snapshot) return GameDictionary.restoreFromSnapshot(snapshot);
    const dictionary = await GameDictionary.create();
    repository.save(dictionary.snapshot);
    return dictionary;
  }

  private static async fetchGameInstance(
    idGenerator: IdGenerator,
    repositories: { dictionary: DictionaryRepository; game: GameRepository },
    settings: GameSettings,
  ): Promise<Game> {
    const dictionary = await this.fetchDictionary(repositories.dictionary);
    const snapshot = await repositories.game.load();
    if (snapshot) {
      const restoredGame = Game.restoreFromSnapshot(snapshot, idGenerator, dictionary);
      if (restoredGame) return restoredGame;
    }
    return Game.create(idGenerator, dictionary, settings);
  }
}
