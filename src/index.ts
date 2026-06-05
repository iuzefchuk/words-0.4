import App from '@/app/index.ts';
import DependenciesFactory from '@/infrastructure/factories/DependenciesFactory.ts';
import type { BootProgressPublisher } from '@/app/types/publishers.ts';

export default function createAppRuntime(): {
  appPromise: Promise<App>;
  bootProgressPublisher: Pick<BootProgressPublisher, 'subscribe'>;
} {
  const dependencies = DependenciesFactory.create();
  return {
    appPromise: App.create(dependencies),
    bootProgressPublisher: dependencies.publishers.bootProgress,
  };
}
