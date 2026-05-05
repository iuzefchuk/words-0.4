<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { Accent } from '@/interface/enums.ts';
type KeydownHandler = (event: KeyboardEvent) => void;
type KeydownStacks = Map<string, Array<KeydownHandler>>;
const stacks: KeydownStacks = ((window as { appButtonKeydownStacks?: KeydownStacks } & Window).appButtonKeydownStacks ??=
  new Map());
const props = defineProps<{
  accent: Accent;
  isDisabled?: boolean;
  keys?: ReadonlyArray<string>;
}>();
const emit = defineEmits<{
  click: [];
}>();
function handleKeydown(event: KeyboardEvent): void {
  if (props.keys?.includes(event.key) !== true) return;
  if (props.isDisabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  emit('click');
}
onMounted(() => {
  if (props.keys === undefined || props.keys.length === 0) return;
  for (const key of props.keys) {
    const stack = stacks.get(key) ?? [];
    const previous = stack[stack.length - 1];
    if (previous !== undefined) window.removeEventListener('keydown', previous, true);
    stack.push(handleKeydown);
    stacks.set(key, stack);
  }
  window.addEventListener('keydown', handleKeydown, true);
});
onUnmounted(() => {
  if (props.keys === undefined || props.keys.length === 0) return;
  window.removeEventListener('keydown', handleKeydown, true);
  for (const key of props.keys) {
    const stack = stacks.get(key);
    if (stack === undefined) continue;
    const index = stack.indexOf(handleKeydown);
    if (index === -1) continue;
    stack.splice(index, 1);
    if (index !== stack.length) continue;
    const restored = stack[stack.length - 1];
    if (restored !== undefined) window.addEventListener('keydown', restored, true);
  }
});
</script>

<template>
  <button
    :class="{
      btn: true,
      'btn--primary': accent === Accent.Primary,
      'btn--secondary': accent === Accent.Secondary,
    }"
    :disabled="isDisabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.btn {
  cursor: pointer;
  text-align: center;
  border-radius: var(--btn-radius);
  user-select: none;
  transition-property: box-shadow;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  border: 1px solid transparent;
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  display: grid;
  place-items: center;
  width: var(--btn-width);
  height: var(--btn-height);
  $accents: 'primary', 'secondary';
  @each $accent in $accents {
    &--#{$accent} {
      background: var(--btn-bg-#{$accent});
      color: var(--btn-color-#{$accent});
      border-color: var(--btn-border-color-#{$accent});
      box-shadow: var(--shadow-xs);
      &:hover:not(:active):not(:disabled) {
        background: var(--btn-bg-#{$accent}-hover);
        color: var(--btn-color-#{$accent}-hover);
        border-color: var(--btn-border-color-#{$accent}-hover);
        box-shadow: var(--shadow-s);
      }
      &:active:not(:disabled) {
        background: var(--btn-bg-#{$accent}-active);
        color: var(--btn-color-#{$accent}-active);
        border-color: var(--btn-border-color-#{$accent}-active);
      }
    }
  }
  &:disabled {
    cursor: not-allowed;
    background: var(--btn-bg-disabled);
    color: var(--btn-color-disabled);
    border-color: var(--btn-border-color-disabled);
    box-shadow: none;
  }
}
</style>
