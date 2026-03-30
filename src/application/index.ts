import AppCommandBuilder from '@/application/commands.ts';
import AppQueryBuilder from '@/application/queries.ts';
import { AppCommands, AppConfig, AppQueries, GameDictionary, GameSettings } from '@/application/types.ts';
import Game from '@/domain/index.ts';
import { DictionaryRepository, GameRepository, IdGenerator } from '@/domain/ports.ts';
import Infrastructure from '@/infrastructure/index.ts';

export default class Application {
  private constructor(
    private readonly queryBuilder: AppQueryBuilder,
    private readonly commandBuilder: AppCommandBuilder,
    private readonly game: Game,
  ) {}

  static async create(settings: GameSettings): Promise<Application> {
    const { idGenerator, clock, scheduler, gameRepository, dictionaryRepository } =
      await Infrastructure.createAppDependencies();
    const game = await this.fetchGameInstance(gameRepository, dictionaryRepository, idGenerator, settings);
    const queryBuilder = new AppQueryBuilder(game);
    const commandBuilder = new AppCommandBuilder(game, clock, scheduler, gameRepository);
    return new Application(queryBuilder, commandBuilder, game);
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

  get commands(): AppCommands {
    return this.commandBuilder.commands;
  }

  private static async fetchGameInstance(
    gameRepository: GameRepository,
    dictionaryRepository: DictionaryRepository,
    idGenerator: IdGenerator,
    settings: GameSettings,
  ): Promise<Game> {
    const dictionary = await this.fetchDictionary(dictionaryRepository);
    const snapshot = await gameRepository.load();
    if (snapshot) {
      const restoredGame = Game.restoreFromSnapshot(snapshot, idGenerator, dictionary);
      if (restoredGame) return restoredGame;
    }
    return Game.create(idGenerator, dictionary, settings);
  }

  private static async fetchDictionary(dictionaryRepository: DictionaryRepository): Promise<GameDictionary> {
    const snapshot = await dictionaryRepository.load();
    if (snapshot) return GameDictionary.restoreFromSnapshot(snapshot);
    const dictionary = GameDictionary.create();
    dictionaryRepository.save(dictionary.snapshot);
    return dictionary;
  }
}
