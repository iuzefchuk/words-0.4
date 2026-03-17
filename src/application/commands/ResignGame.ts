import { GameContext } from '@/application/types.ts';

export default class ResignGame {
  static execute(context: GameContext): void {
    context.turnDirector.resignCurrentTurn();
  }
}
