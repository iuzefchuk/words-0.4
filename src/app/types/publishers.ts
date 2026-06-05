export type AppBootProgressPublisher = {
  publish(progress: number): void;
  subscribe(handler: (progress: number) => void): void;
};

export type AppPublishers = {
  bootProgress: AppBootProgressPublisher;
};
