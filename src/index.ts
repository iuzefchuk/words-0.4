import App from '@/app/App.ts';
import AppDependenciesFactory from '@/infrastructure/AppDependenciesFactory.ts';
import type { AppBootProgressPublisher } from '@/app/types/publishers.ts';

export default function createAppRuntime(): {
  bootProgressPublisher: Pick<AppBootProgressPublisher, 'subscribe'>;
  promise: Promise<App>;
} {
  const dependencies = AppDependenciesFactory.create();
  return {
    bootProgressPublisher: dependencies.publishers.bootProgress,
    promise: App.boot(dependencies),
  };
}
