import { ref, shallowRef, watch } from 'vue';
import defaultGeneral from '@/interface/plugins/LocalesPlugin/en/general.json';
import type { App, Ref, ShallowRef } from 'vue';

export enum LocaleType {
  En = 'en',
}

enum NumberSeparatorType {
  Comma = 'en-US',
  Dot = 'de-DE',
  Space = 'fr-FR',
}

export type LocaleNumberGetter = (number: number) => string;

export type LocaleTextGetter = (string: string, props?: Record<string, number | string>) => string;

const DEFAULTS: Record<string, Record<string, string>> = {
  general: defaultGeneral,
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

  install(app: App): void {
    this.loadNamespace('general');
    watch(this.type, () => {
      this.cachedFormatter = LocalesPlugin.createFormatter(this.type.value);
      this.reloadNamespaces();
    });
    this.setGlobals(app);
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

  private readonly getLocalizedNumber: LocaleNumberGetter = (number: number) => {
    return this.cachedFormatter.format(number);
  };

  private readonly getLocalizedText: LocaleTextGetter = (string: string, props?: object) => {
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
  };

  private setGlobals(app: App): void {
    const globals = app.config.globalProperties;
    window.localeType = globals.localeType = this.type;
    window.text = globals.text = this.getLocalizedText.bind(this);
    window.number = globals.number = this.getLocalizedNumber.bind(this);
  }
}
