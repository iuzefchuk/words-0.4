import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Index from '@/interface/components/by-hierarchy/index.vue';
import DirectivesPlugin from '@/interface/plugins/DirectivesPlugin/DirectivesPlugin.ts';
import LocalesPlugin from '@/interface/plugins/LocalesPlugin/LocalesPlugin.ts';

class Interface {
  private readonly app = createApp(Index);

  start(): void {
    this.installPlugins();
    this.mount();
  }

  private installPlugins(): void {
    LocalesPlugin.create().install(this.app);
    this.app.use(createPinia());
    this.app.use(new DirectivesPlugin());
  }

  private mount(): void {
    this.app.mount('#app');
  }
}

void new Interface().start();
