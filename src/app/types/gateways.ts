export type AppGateways = {
  loader: LoaderGateway;
  scheduler: SchedulerGateway;
  worker: WorkerGateway;
};

export type LoaderGateway = {
  load(url: string): Promise<ArrayBufferLike>;
};

export type SchedulerGateway = {
  padTo<T>(minimumMs: number, callback: () => Promise<T> | T): Promise<T>;
  yield(): Promise<void>;
};

export type WorkerGateway = {
  getPoolSize(taskId: string): number;
  init(taskId: string, data: unknown): Promise<void>;
  stream<O>(taskId: string, inputs: ReadonlyArray<unknown>): AsyncGenerator<O>;
};
