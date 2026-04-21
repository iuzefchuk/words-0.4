import Turns from '@/domain/models/turns/Turns.ts';

export default class SettingsMutationSpec {
  static isSatisfiedBy(turns: Turns): boolean {
    return !turns.historyHasPriorTurns;
  }
}
