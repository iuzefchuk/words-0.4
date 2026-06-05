import Application from '@/application/index.ts';
import DependenciesFactory from '@/infrastructure/factories/DependenciesFactory.ts';
import type { BootProgressPublisher } from '@/application/types/publishers.ts';

export default function createApplicationRuntime(): {
  app: Promise<Application>;
  bootProgressPublisher: Pick<BootProgressPublisher, 'subscribe'>;
} {
  const dependencies = DependenciesFactory.create();
  return {
    app: Application.create(dependencies),
    bootProgressPublisher: dependencies.publishers.bootProgress,
  };
}
