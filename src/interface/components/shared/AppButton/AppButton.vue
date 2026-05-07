<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { Accent } from '@/interface/enums.ts';
const props = defineProps<{
  accent: Accent;
  isDisabled?: boolean;
  keys?: ReadonlyArray<string>;
}>();
const emit = defineEmits<{
  trigger: [];
}>();
if (props.keys !== undefined) {
  const { keys } = props;
  const onKeydown = (event: KeyboardEvent): void => {
    if (document.querySelector('dialog[open]') !== null) return;
    if (!keys.includes(event.key)) return;
    if (props.isDisabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    emit('trigger');
  };
  onMounted(() => {
    window.addEventListener('keydown', onKeydown, true);
  });
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown, true);
  });
}
</script>

<template>
  <button
    :class="{
      btn: true,
      'btn--primary': accent === Accent.Primary,
      'btn--secondary': accent === Accent.Secondary,
    }"
    :disabled="isDisabled"
    @click="$emit('trigger')"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
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
