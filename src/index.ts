import App from '@/app/App.ts';
import AppDependenciesFactory from '@/infrastructure/AppDependenciesFactory';
import type { AppBootProgressPublisher } from '@/app/types/publishers.ts';

export default function createAppRuntime(): {
  promise: Promise<App>;
  bootProgressPublisher: Pick<AppBootProgressPublisher, 'subscribe'>;
} {
  const dependencies = AppDependenciesFactory.create();
  return {
    promise: App.create(dependencies),
    bootProgressPublisher: dependencies.publishers.bootProgress,
  };
}
