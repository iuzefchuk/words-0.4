<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore from '@/interface/stores/DialogStore/DialogStore.ts';
const props = withDefaults(
  defineProps<{
    accent: Accent;
    isDisabled?: boolean;
    keys?: ReadonlyArray<string>;
  }>(),
  {
    isDisabled: false,
    keys: () => [],
  },
);
const emit = defineEmits<{
  trigger: [];
}>();
const REF_BUTTON = 'button';
const buttonEl = useTemplateRef<HTMLButtonElement>(REF_BUTTON);
const dialogStore = DialogStore.INSTANCE();
const onClick = (): void => {
  emit('trigger');
};
if (props.keys.length > 0) {
  const { keys } = props;
  const onKeydown = (event: KeyboardEvent): void => {
    if (dialogStore.isOpen) return;
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
defineExpose({
  focus: () => buttonEl.value?.focus(),
});
</script>

<template>
  <button
    :ref="REF_BUTTON"
    :class="{
      btn: true,
      'btn--primary': accent === Accent.Primary,
      'btn--secondary': accent === Accent.Secondary,
    }"
    :disabled="isDisabled"
    @click="onClick"
  >
    <slot />
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
