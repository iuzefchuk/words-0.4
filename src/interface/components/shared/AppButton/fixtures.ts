import { mount, type VueWrapper } from '@vue/test-utils';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import { Accent, Key } from '@/interface/enums.ts';

type AppButtonFixture = {
  readonly desc: string;
  readonly mountInstance: (options?: { attachTo?: HTMLElement }) => VueWrapper;
  readonly props: {
    accent: Accent;
    isDisabled: boolean;
    keys: ReadonlyArray<string>;
  };
  readonly slot: null | string;
};

const fixtures: ReadonlyArray<AppButtonFixture> = [Accent.Primary, Accent.Secondary].flatMap(accent =>
  [false, true].flatMap(isDisabled =>
    [[], [Key.Enter], [Key.Enter, Key.Space]].flatMap(keys =>
      ['Go', null].map(slot => {
        const props = { accent, isDisabled, keys };
        return {
          desc: `${accent}, ${isDisabled ? 'disabled' : 'enabled'}, w/ ${String(keys.length)} keys, ${slot === null ? 'w/out slot' : 'w/ slot'}`,
          mountInstance: (options: { attachTo?: HTMLElement } = {}): VueWrapper =>
            mount(AppButton, { ...options, props, slots: slot !== null ? { default: slot } : {} }),
          props,
          slot,
        };
      }),
    ),
  ),
);

export default fixtures;
