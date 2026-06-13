import { ref, shallowRef, watch } from 'vue';
import defaultDialog from '@/interface/plugins/LocalesPlugin/en/dialog.json';
import defaultEnd from '@/interface/plugins/LocalesPlugin/en/end.json';
import defaultGame from '@/interface/plugins/LocalesPlugin/en/game.json';
import defaultSettings from '@/interface/plugins/LocalesPlugin/en/settings.json';
import type { App, Ref, ShallowRef } from 'vue';

export enum LocaleType {
  En = 'en',
}

enum NumberSeparatorType {
  Comma = 'en-US',
  Dot = 'de-DE',
  Space = 'fr-FR',
}

const DEFAULTS: Record<string, Record<string, string>> = {
  dialog: defaultDialog,
  end: defaultEnd,
  game: defaultGame,
  settings: defaultSettings,
};

export default class LocalesPlugin {
  private static pluginInstance: LocalesPlugin;

  private static readonly NUMBER_SEPARATOR_TYPE_FOR_LOCALE = {
    [LocaleType.En]: NumberSeparatorType.Dot,
  };

  private cachedFormatter: Intl.NumberFormat;
  private readonly namespaces = new Map<string, ShallowRef<Record<string, string> | null>>();

  private constructor(private readonly type: Ref<LocaleType>) {
    this.cachedFormatter = LocalesPlugin.createFormatter(type.value);
  }

  static get instance(): LocalesPlugin {
    return LocalesPlugin.pluginInstance;
  }

  static create(): LocalesPlugin {
    const type = ref(document.documentElement.getAttribute('lang') as LocaleType);
    LocalesPlugin.pluginInstance = new LocalesPlugin(type);
    return LocalesPlugin.pluginInstance;
  }

  install(_app: App): void {
    this.loadNamespace('game');
    watch(this.type, () => {
      this.cachedFormatter = LocalesPlugin.createFormatter(this.type.value);
      this.reloadNamespaces();
    });
  }

  loadNamespace(file: string): ShallowRef<Record<string, string> | null> {
    const existing = this.namespaces.get(file);
    if (existing !== undefined) return existing;

    const defaultContent = DEFAULTS[file];
    const isDefault = defaultContent !== undefined && this.type.value === LocaleType.En;
    const content = shallowRef<Record<string, string> | null>(isDefault ? defaultContent : null);
    this.namespaces.set(file, content);

    if (!isDefault) void this.fetchNamespace(file, content);

    return content;
  }

  getText(string: string, props?: Record<string, number | string>): string {
    const [file, key] = string.split('.');
    if (file === undefined || key === undefined) {
      throw new ReferenceError(`expected locale key in "file.key" format, got "${string}"`);
    }
    const namespace = this.namespaces.get(file);
    if (namespace === undefined || namespace.value === null) {
      throw new ReferenceError(`namespace "${file}" not loaded`);
    }
    const localizedText = namespace.value[key];
    if (localizedText === undefined || localizedText === '') {
      throw new ReferenceError(`locale not found for "${file}.${key}"`);
    }
    let result = localizedText;
    if (props !== undefined) {
      for (const [propKey, value] of Object.entries(props)) {
        result = result.replaceAll(`{${propKey}}`, String(value));
      }
    }
    return result;
  }

  getNumber(number: number): string {
    return this.cachedFormatter.format(number);
  }

  private static createFormatter(locale: LocaleType): Intl.NumberFormat {
    return new Intl.NumberFormat(LocalesPlugin.NUMBER_SEPARATOR_TYPE_FOR_LOCALE[locale], {
      maximumFractionDigits: 2,
    });
  }

  private async fetchNamespace(file: string, target: ShallowRef<Record<string, string> | null>): Promise<void> {
    const module = await import(`./${this.type.value}/${file}.json`);
    target.value = module.default ?? module;
  }

  private reloadNamespaces(): void {
    for (const [file, content] of this.namespaces) {
      const defaultContent = DEFAULTS[file];
      if (defaultContent !== undefined && this.type.value === LocaleType.En) {
        content.value = defaultContent;
      } else {
        void this.fetchNamespace(file, content);
      }
    }
  }
}

export function getText(string: string, props?: Record<string, number | string>): string {
  return LocalesPlugin.instance.getText(string, props);
}

export function getNumber(number: number): string {
  return LocalesPlugin.instance.getNumber(number);
}
