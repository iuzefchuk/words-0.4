import { AppDomain, AppPlayer, AppDomainHydrator, AppTurnGenerator } from '@/application/types.ts';

self.onmessage = (event: MessageEvent<{ domain: AppDomain; player: AppPlayer }>) => {
  try {
    const { domain, player } = event.data;
    if (!domain || !player) {
      throw new Error('Invalid worker request: missing domain or player');
    }
    const hydrated = AppDomainHydrator.execute(domain);
    for (const result of AppTurnGenerator.execute(hydrated.toGeneratorContext(), player)) {
      return self.postMessage({ return: result });
    }
    self.postMessage({ return: null });
  } catch (error) {
    self.postMessage({ return: null, error: error instanceof Error ? error.message : String(error) });
  }
};
