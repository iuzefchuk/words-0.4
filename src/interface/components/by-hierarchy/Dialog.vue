<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import AppButton from '@/interface/components/app/AppButton.vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore, { DialogStatus } from '@/interface/stores/DialogStore.ts';
const ID_TITLE = 'title';
const ID_HTML = 'html';
const REF_KEY_BUTTONS = 'buttons';
const REF_KEY_DIALOG = 'dialog';
const dialogStore = DialogStore.INSTANCE();
const { html, isDestructive, title } = storeToRefs(dialogStore);
const refDialog = useTemplateRef<HTMLDialogElement>(REF_KEY_DIALOG);
const refButtons = useTemplateRef<Array<{ focus: () => void }>>(REF_KEY_BUTTONS);
const lastFocusedElement = ref<HTMLElement | null>(null);
const dialogIsShaking = ref(false);
const focusedButtonIdx = computed(() => (isDestructive.value ? 0 : 1));

function emitResponse(status: DialogStatus): void {
  if (refDialog.value?.open === true) refDialog.value.close();
  dialogStore.resolve({ status });
  lastFocusedElement.value?.focus();
  lastFocusedElement.value = null;
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === refDialog.value) shake();
}

function shake(): void {
  dialogIsShaking.value = true;
  setTimeout(() => {
    dialogIsShaking.value = false;
  }, 250);
}

watch(html, async newValue => {
  if (newValue === null) return;
  lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  refDialog.value?.showModal();
  refButtons.value?.[focusedButtonIdx.value]?.focus();
});
</script>

<template>
  <dialog
    :ref="REF_KEY_DIALOG"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="title ? ID_TITLE : undefined"
    :aria-describedby="ID_HTML"
    :class="{ dialog: true, 'dialog--shaking': dialogIsShaking }"
    @click="onBackdropClick"
    @cancel.prevent="emitResponse(DialogStatus.Canceled)"
  >
    <div class="dialog__content">
      <h2 v-if="title" :id="ID_TITLE">{{ title }}</h2>
      <div :id="ID_HTML" class="app__make-secondary" v-html="html" />
    </div>
    <div class="dialog__footer">
      <AppButton
        v-for="button in [
          {
            accent: isDestructive ? Accent.Primary : Accent.Secondary,
            status: DialogStatus.Canceled,
            text: text('general.dialog_cancel'),
          },
          {
            accent: isDestructive ? Accent.Secondary : Accent.Primary,
            status: DialogStatus.Confirmed,
            text: text('general.dialog_confirm'),
          },
        ]"
        :key="button.status"
        :ref="REF_KEY_BUTTONS"
        :accent="button.accent"
        :text="button.text"
        @trigger="emitResponse(button.status)"
      />
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
@use '@style/themes' as *;
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
