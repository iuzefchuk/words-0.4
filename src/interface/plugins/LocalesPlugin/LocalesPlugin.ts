import { ref, watch } from 'vue';
import defaultGeneral from '@/interface/plugins/LocalesPlugin/en/general.json';
import type { App, Ref } from 'vue';

export enum LocaleType {
  En = 'en',
}

enum LocaleFile {
  General = 'general',
}

enum NumberSeparatorType {
  Comma = 'en-US',
  Dot = 'de-DE',
  Space = 'fr-FR',
}

export type LocaleNumberGetter = (number: number) => string;

export type LocaleTextGetter = (string: string, props?: Record<string, number | string>) => string;

type LocaleFileContent = Record<LocaleFile, Record<string, string>>;

export default class LocalesPlugin {
  private static readonly NUMBER_SEPARATOR_TYPE_FOR_LOCALE = {
    [LocaleType.En]: NumberSeparatorType.Dot,
  };

  private cachedFormatter: Intl.NumberFormat;

  private constructor(
    private readonly type: Ref<LocaleType>,
    private readonly content: Ref<LocaleFileContent>,
  ) {
    this.cachedFormatter = LocalesPlugin.createFormatter(type.value);
  }

  static create(): LocalesPlugin {
    const type = ref(document.documentElement.getAttribute('lang') as LocaleType);
    const content = ref({} as LocaleFileContent);
    return new LocalesPlugin(type, content);
  }

  install(app: App): void {
    this.loadDefaultContent();
    watch(this.type, () => {
      this.cachedFormatter = LocalesPlugin.createFormatter(this.type.value);
      void this.fetchContent();
    });
    this.setGlobals(app);
  }

  private loadDefaultContent(): void {
    this.content.value[LocaleFile.General] = defaultGeneral;
  }

  private static createFormatter(locale: LocaleType): Intl.NumberFormat {
    return new Intl.NumberFormat(LocalesPlugin.NUMBER_SEPARATOR_TYPE_FOR_LOCALE[locale], {
      maximumFractionDigits: 2,
    });
  }

  private async fetchContent(): Promise<void> {
    await Promise.all(
      Object.values(LocaleFile).map(async file => {
        this.content.value[file] = await import(`./${this.type.value}/${file}.json`);
      }),
    );
  }

  private readonly getLocalizedNumber: LocaleNumberGetter = (number: number) => {
    return this.cachedFormatter.format(number);
  };

  private readonly getLocalizedText: LocaleTextGetter = (string: string, props?: object) => {
    const [file, key] = string.split('.');
    if (file === undefined || key === undefined) {
      throw new ReferenceError(`expected locale key in "file.key" format, got "${string}"`);
    }
    const localizedText = this.content.value[file as LocaleFile][key];
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
