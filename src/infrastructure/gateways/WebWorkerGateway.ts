import { WorkerRequestType, WorkerResponseType } from '@/application/types/gateways.ts';
import WorkerPoolGateway from '@/infrastructure/gateways/WorkerPoolGateway.ts';
import type { WorkerGateway, WorkerRequest, WorkerResponse } from '@/application/types/gateways.ts';

export default class WebWorkerGateway implements WorkerGateway {
  private readonly initData = new Map<string, unknown>();
  private readonly initPromises = new Map<string, Promise<void>>();

  constructor(private readonly workers: Record<string, new () => Worker>) {}

  getPoolSize(taskId: string): number {
    return WorkerPoolGateway.getPoolSize(taskId);
  }

  init(taskId: string, data: unknown): Promise<void> {
    this.initData.set(taskId, data);
    const count = WorkerPoolGateway.computePoolSize();
    const workers: Array<Worker> = [];
    for (let i = 0; i < count; i++) {
      workers.push(WorkerPoolGateway.takeFromPool(taskId) ?? this.createWorker(taskId));
    }
    const promise = Promise.all(workers.map(worker => this.initWorker(worker, data))).then(() => {
      for (const worker of workers) WorkerPoolGateway.returnToPool(taskId, worker);
    });
    this.initPromises.set(taskId, promise);
    return promise;
  }

  spawnPool(taskId: string): void {
    const workers = Array.from({ length: WorkerPoolGateway.computePoolSize() }, () => this.createWorker(taskId));
    for (const worker of workers) WorkerPoolGateway.returnToPool(taskId, worker);
  }

  async *stream<O>(taskId: string, inputs: ReadonlyArray<unknown>): AsyncGenerator<O> {
    const pending = this.initPromises.get(taskId);
    if (pending !== undefined) {
      await pending;
      this.initPromises.delete(taskId);
    }
    const workers: Array<Worker> = [];
    for (const _ of inputs) {
      const pooled = WorkerPoolGateway.takeFromPool(taskId);
      if (pooled !== undefined) {
        workers.push(pooled);
      } else {
        const fresh = this.createWorker(taskId);
        const data = this.initData.get(taskId);
        if (data !== undefined) await this.initWorker(fresh, data);
        workers.push(fresh);
      }
    }
    const state = WorkerPoolGateway.createStreamState<WorkerResponse>();
    const totalWorkers = workers.length;
    for (let idx = 0; idx < workers.length; idx++) {
      const worker = workers[idx];
      if (worker === undefined) throw new ReferenceError(`expected worker at index ${String(idx)}, got undefined`);
      WorkerPoolGateway.wireWorker(worker, state, msg => msg.type === WorkerResponseType.Done);
      worker.postMessage({ input: inputs[idx], type: WorkerRequestType.Stream } satisfies WorkerRequest);
    }
    try {
      for await (const msg of WorkerPoolGateway.drainStream(state, () => state.doneCount >= totalWorkers)) {
        if (msg.type === WorkerResponseType.Error) throw new Error(msg.error);
        if (msg.type === WorkerResponseType.Result) yield msg.value as O;
      }
    } finally {
      if (state.doneCount >= totalWorkers) {
        for (const worker of workers) WorkerPoolGateway.returnToPool(taskId, worker);
      } else {
        for (const worker of workers) worker.terminate();
      }
    }
  }

  private createWorker(taskId: string): Worker {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const WorkerConstructor = this.workers[taskId];
    if (WorkerConstructor === undefined) throw new Error(`no worker registered for task ${taskId}`);
    return new WorkerConstructor();
  }

  private initWorker(worker: Worker, data: unknown): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === WorkerResponseType.Ready) resolve();
        else reject(new Error(`expected worker Ready response, got ${event.data.type}`));
      };
      worker.onerror = () => {
        reject(new Error('worker error'));
      };
      worker.postMessage({ input: data, type: WorkerRequestType.Init } satisfies WorkerRequest);
    });
  }
}
