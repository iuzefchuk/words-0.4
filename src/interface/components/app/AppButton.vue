<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore from '@/interface/stores/DialogStore.ts';
const props = withDefaults(
  defineProps<{
    accent: Accent;
    isDisabled?: boolean;
    keys?: ReadonlyArray<string>;
    text: string;
  }>(),
  {
    isDisabled: false,
    keys: () => [],
  },
);
const emits = defineEmits<{ trigger: [] }>();
defineExpose({
  focus: () => ref.value?.focus(),
});
const REF_KEY = 'button';
const ref = useTemplateRef<HTMLButtonElement>(REF_KEY);
const dialogStore = DialogStore.INSTANCE();

function onClick(): void {
  emits('trigger');
}

function onKeydown(event: KeyboardEvent): void {
  if (dialogStore.isOpen) return;
  if (!props.keys.includes(event.key)) return;
  if (props.isDisabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  emits('trigger');
}

function useKeys(): void {
  // TODO to separate composable
  onMounted(() => {
    window.addEventListener('keydown', onKeydown, true);
  });
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown, true);
  });
}

if (props.keys.length > 0) useKeys();
</script>

<template>
  <button
    :ref="REF_KEY"
    :class="{
      btn: true,
      'btn--primary': accent === Accent.Primary,
      'btn--secondary': accent === Accent.Secondary,
    }"
    :disabled="isDisabled"
    @click="onClick"
  >
    {{ text }}
  </button>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;
.btn {
  cursor: pointer;
  text-align: center;
  border-radius: var(--space-xs);
  user-select: none;
  transition-property: box-shadow;
  transition-duration: var(--transition-duration);
  transition-timing-function: var(--transition-timing-function);
  border: 1px solid transparent;
  font-size: var(--font-size-small);
  display: grid;
  place-items: center;
  width: calc(var(--space-6xl) * 2);
  @media screen and (max-width: $breakpoint-mobile) {
    width: 100%;
  }
  height: var(--space-5xl);
  box-shadow: var(--shadow-xs);
  font-weight: var(--font-weight);
  $accents: 'primary', 'secondary';
  @each $accent in $accents {
    &--#{$accent} {
      background: var(--btn-bg-#{$accent});
      color: var(--btn-color-#{$accent});
      border-color: var(--btn-border-color-#{$accent});
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
