import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Index from '@/gui/components/by-hierarchy/index.vue';
import DirectivesPlugin from '@/gui/plugins/DirectivesPlugin/DirectivesPlugin.ts';
import LocalesPlugin from '@/gui/plugins/LocalesPlugin/LocalesPlugin.ts';
import ProvidesPlugin from '@/gui/plugins/ProvidesPlugin.ts';
import MainStore from '@/gui/stores/MainStore.ts';

class Presentation {
  private app = createApp(Index);

  async start(): Promise<void> {
    try {
      await Promise.allSettled([this.installAsyncPlugins(), MainStore.start()]);
      this.installPlugins();
      this.mount();
    } catch (error) {
      console.error(error);
    }
  }

  private async installAsyncPlugins(): Promise<void> {
    await LocalesPlugin.create().install(this.app);
  }

  private installPlugins(): void {
    this.app.use(createPinia());
    this.app.use(new DirectivesPlugin());
    this.app.use(new ProvidesPlugin());
  }

  private mount(): void {
    this.app.mount('#app');
  }
}

new Presentation().start();
