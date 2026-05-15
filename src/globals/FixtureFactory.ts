import { mount, type VueWrapper } from '@vue/test-utils';
import type { Component } from 'vue';

export type CreateParams<A extends Axes> = {
  readonly component: Component;
  readonly props: A;
  readonly slot?: ReadonlyArray<null | string>;
};

export type Fixture<Props> = {
  readonly desc: string;
  readonly mountInstance: MountInstance;
  readonly props: Props;
  readonly slot: null | string;
};

export type MountInstance = (options?: { attachTo?: HTMLElement }) => VueWrapper;

type Axes = Record<string, ReadonlyArray<unknown>>;

type Combo<A extends Axes> = { readonly [K in keyof A]: A[K][number] };

export default class FixtureFactory {
  static createForComponent<A extends Axes>(params: CreateParams<A>): ReadonlyArray<Fixture<Combo<A>>> {
    const slots: ReadonlyArray<null | string> = params.slot ?? [null];
    return FixtureFactory.cartesian(params.props).flatMap(props =>
      slots.map(slot => ({
        desc: FixtureFactory.describe({ ...props, slot }),
        mountInstance: FixtureFactory.mountInstance(params.component, props, slot),
        props,
        slot,
      })),
    );
  }

  private static cartesian<A extends Axes>(axes: A): ReadonlyArray<Combo<A>> {
    let result: Array<Record<string, unknown>> = [{}];
    for (const [key, values] of Object.entries(axes)) {
      result = result.flatMap(combo => values.map(value => ({ ...combo, [key]: value })));
    }
    return result as ReadonlyArray<Combo<A>>;
  }

  private static describe(combo: Record<string, unknown>): string {
    return Object.entries(combo)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');
  }

  private static mountInstance(component: Component, props: Record<string, unknown>, slot: null | string): MountInstance {
    return (options: { attachTo?: HTMLElement } = {}): VueWrapper =>
      mount(component, {
        ...options,
        props,
        ...(slot === null ? {} : { slots: { default: slot } }),
      });
  }
}
