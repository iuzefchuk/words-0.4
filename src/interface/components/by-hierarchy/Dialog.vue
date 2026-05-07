<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore, { DialogStatus } from '@/interface/stores/DialogStore.ts';
const dialogStore = DialogStore.INSTANCE();
const { cancelText, confirmText, html, isDestructive, title } = storeToRefs(dialogStore);
const ids = {
  body: 'dialog-body',
  title: 'dialog-title',
};
const dialogEl = useTemplateRef<HTMLDialogElement>('dialog');
const previousFocus = ref<HTMLElement | null>(null);
const dialogIsShaking = ref(false);
const buttons = computed(() => [
  {
    accent: isDestructive.value ? Accent.Primary : Accent.Secondary,
    autofocus: isDestructive.value,
    status: DialogStatus.Canceled,
    text: cancelText.value,
  },
  {
    accent: isDestructive.value ? Accent.Secondary : Accent.Primary,
    autofocus: !isDestructive.value,
    status: DialogStatus.Confirmed,
    text: confirmText.value,
  },
]);
function emitResponse(status: DialogStatus): void {
  if (dialogEl.value?.open === true) dialogEl.value.close();
  dialogStore.resolve({ status });
  previousFocus.value?.focus();
  previousFocus.value = null;
}
function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialogEl.value) shake();
}
function shake(): void {
  dialogIsShaking.value = true;
  setTimeout(() => {
    dialogIsShaking.value = false;
  }, 250);
}
watch(html, async newValue => {
  if (newValue === null) return;
  previousFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  dialogEl.value?.showModal();
});
</script>

<template>
  <dialog
    ref="dialog"
    role="alertdialog"
    :aria-labelledby="title === null ? undefined : ids.title"
    :aria-describedby="ids.body"
    :class="{ dialog: true, 'dialog--shaking': dialogIsShaking }"
    @click="onBackdropClick"
    @cancel.prevent="emitResponse(DialogStatus.Canceled)"
  >
    <div class="dialog__content">
      <h2 v-if="title" :id="ids.title">{{ title }}</h2>
      <div :id="ids.body" class="app__make-secondary" v-html="html" />
    </div>
    <div class="dialog__footer">
      <AppButton
        v-for="button in buttons"
        :key="button.status"
        :accent="button.accent"
        :autofocus="button.autofocus"
        @trigger="emitResponse(button.status)"
      >
        {{ button.text }}
      </AppButton>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
@use '@/interface/assets/scss/themes' as *;
.dialog {
  @include dark-theme;
  @media (prefers-color-scheme: dark) {
    @include light-theme;
  }
  background: var(--primary-bg);
  border-radius: var(--space-s);
  color: var(--primary-color);
  padding: var(--space-xl);
  border: none;
  flex-direction: column;
  gap: var(--space-2xl);
  box-shadow: var(--shadow-2xl);
  max-width: min(28rem, calc(100vw - 2 * var(--space-l)));
  opacity: 0;
  transition:
    opacity var(--transition-duration) var(--transition-timing-function),
    display var(--transition-duration) allow-discrete,
    overlay var(--transition-duration) allow-discrete;
  &[open] {
    display: flex;
    opacity: 1;
    @starting-style {
      opacity: 0;
    }
  }
  &--shaking {
    animation: horizontal-shake var(--transition-duration) linear forwards;
  }
  &::backdrop {
    background: rgba(0 0 0 / 0.2);
    transition:
      background var(--transition-duration) var(--transition-timing-function),
      display var(--transition-duration) allow-discrete,
      overlay var(--transition-duration) allow-discrete;
    @starting-style {
      background: rgba(0 0 0 / 0);
    }
  }
  &:not([open])::backdrop {
    background: rgba(0 0 0 / 0);
  }
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }
  &__footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: var(--space-m);
  }
}
</style>
