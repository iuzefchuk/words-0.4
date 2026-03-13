import { GameContext } from '@/application/types.ts';

export default class PassTurn {
  static execute(context: GameContext): void {
    context.turnDirector.passCurrentTurn();
  }
}
