import AppCommandBuilder from '@/application/commands.ts';
import AppQueryBuilder from '@/application/queries.ts';
import { AppCommands, AppConfig, AppQueries } from '@/application/types.ts';
import Game from '@/domain/index.ts';
import Infrastructure from '@/infrastructure/index.ts';

export default class Application {
  private constructor(
    private readonly queryBuilder: AppQueryBuilder,
    private readonly commandBuilder: AppCommandBuilder,
    private readonly game: Game,
  ) {}

  static async create(): Promise<Application> {
    const { dictionary, idGenerator, clock, scheduler } = await Infrastructure.createAppDependencies();
    const game = Game.create(dictionary, idGenerator);
    const queryBuilder = new AppQueryBuilder(game);
    const commandBuilder = new AppCommandBuilder(game, clock, scheduler);
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
}
