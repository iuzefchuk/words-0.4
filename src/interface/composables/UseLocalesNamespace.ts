import { computed, type ComputedRef } from 'vue';
import LocalesPlugin from '@/interface/plugins/LocalesPlugin/LocalesPlugin.ts';

type Namespace = {
  ready: ComputedRef<boolean>;
  t: (key: string, props?: Record<string, number | string>) => string;
};

export default function useLocalesNamespace(file: string): Namespace {
  const content = LocalesPlugin.instance.loadNamespace(file);

  const ready = computed(() => content.value !== null);

  const t = (key: string, props?: Record<string, number | string>): string => {
    if (content.value === null) return '';
    const text = content.value[key];
    if (text === undefined || text === '') {
      throw new ReferenceError(`locale not found for "${file}.${key}"`);
    }
    if (props === undefined) return text;
    let result = text;
    for (const [propKey, value] of Object.entries(props)) {
      result = result.replaceAll(`{${propKey}}`, String(value));
    }
    return result;
  };

  return { ready, t };
}
