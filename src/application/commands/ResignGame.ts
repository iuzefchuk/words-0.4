import { GameContext } from '@/application/index.ts';

export default class ResignGame {
  static execute(context: GameContext): void {
    context.turnDirector.resignCurrentTurn();
  }
}
