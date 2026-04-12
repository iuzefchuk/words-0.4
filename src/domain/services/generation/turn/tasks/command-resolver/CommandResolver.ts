import { GenerationCommandType } from '@/domain/services/generation/turn/enums.ts';
import { GeneratorResult } from '@/domain/services/generation/turn/TurnGenerationService.ts';
import { ContinueTaskCommand, ReturnTaskCommand, StopTaskCommand, Task, TaskCommand } from '@/domain/services/generation/turn/types.ts';

export default class TaskCommandResolver {
  private static readonly YIELD_INTERVAL = 100;

  private constructor(private readonly stack: Array<Task>) {}

  static continueExecute(newTasks: Array<Task>): ContinueTaskCommand {
    return { newTasks, type: GenerationCommandType.ContinueExecute };
  }

  static create(firstTask: Task): TaskCommandResolver {
    const tasks = [firstTask];
    return new TaskCommandResolver(tasks);
  }

  static returnResult(result: GeneratorResult): ReturnTaskCommand {
    return { result, type: GenerationCommandType.ReturnResult };
  }

  static stopExecute(): StopTaskCommand {
    return { type: GenerationCommandType.StopExecute };
  }

  async *execute(dispatcher: (task: Task) => TaskCommand, yieldControl: () => Promise<void>): AsyncGenerator<GeneratorResult> {
    let taskCount = 0;
    while (this.stack.length > 0) {
      const task = this.popFromStack();
      const command = dispatcher(task);
      if (command.type === GenerationCommandType.ContinueExecute) this.pushToStack(command.newTasks);
      if (command.type === GenerationCommandType.ReturnResult) yield command.result;
      if (++taskCount % TaskCommandResolver.YIELD_INTERVAL === 0) await yieldControl();
    }
  }

  private popFromStack(): Task {
    const lastTask = this.stack.pop();
    if (lastTask === undefined) throw new ReferenceError('Task has to exist');
    return lastTask;
  }

  private pushToStack(tasks: Array<Task>): void {
    for (let i = tasks.length - 1; i >= 0; i--) {
      const task = tasks[i];
      if (task === undefined) throw new ReferenceError('Task must be defined');
      this.stack.push(task);
    }
  }
}
