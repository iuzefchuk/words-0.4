import AppCommandBuilder from '@/application/commands.ts';
import AppQueryBuilder from '@/application/queries.ts';
import { AppCommands, AppConfig, AppQueries } from '@/application/types.ts';
import Game from '@/domain/index.ts';
import Dictionary from '@/domain/models/Dictionary.ts';
import { DictionaryRepository, GameRepository } from '@/domain/ports.ts';
import { IdGenerator } from '@/domain/ports.ts';
import Infrastructure from '@/infrastructure/index.ts';

export default class Application {
  private constructor(
    private readonly queryBuilder: AppQueryBuilder,
    private readonly commandBuilder: AppCommandBuilder,
    private readonly game: Game,
  ) {}

  static async create(): Promise<Application> {
    const { idGenerator, clock, scheduler, gameRepository, dictionaryRepository } =
      await Infrastructure.createAppDependencies();
    const game = await this.fetchGameInstance(gameRepository, dictionaryRepository, idGenerator);
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
  ): Promise<Game> {
    const dictionary = await this.fetchDictionary(dictionaryRepository);
    const snapshot = await gameRepository.load();
    if (snapshot) {
      const restoredGame = Game.restoreFromSnapshot(snapshot, idGenerator, dictionary);
      if (restoredGame) return restoredGame;
    }
    return Game.create(idGenerator, dictionary);
  }

  private static async fetchDictionary(dictionaryRepository: DictionaryRepository): Promise<Dictionary> {
    const snapshot = await dictionaryRepository.load();
    if (snapshot) return Dictionary.restoreFromSnapshot(snapshot);
    const dictionary = Dictionary.create();
    dictionaryRepository.save(dictionary.snapshot);
    return dictionary;
  }
}
