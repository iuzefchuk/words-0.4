export type BootProgressPublisher = {
  publish(progress: number): void;
  subscribe(handler: (progress: number) => void): void;
};
