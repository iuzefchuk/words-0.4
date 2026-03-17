export type Clock = {
  now(): number;
  wait(ms: number): Promise<void>;
};

export type IdGenerator = {
  execute(): string;
};
