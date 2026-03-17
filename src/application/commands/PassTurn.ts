import { GameContext } from '@/application/index.ts';

export default class PassTurn {
  static execute(context: GameContext): void {
    context.turnDirector.passCurrentTurn();
  }
}
