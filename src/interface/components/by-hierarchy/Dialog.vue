<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore, { DialogStatus } from '@/interface/stores/DialogStore.ts';
const dialogStore = DialogStore.INSTANCE();
const { cancelText, confirmText, html, isDestructive, title } = storeToRefs(dialogStore);
const isRendered = ref(false);
const exitAnimation = ref(false);
const titleId = 'dialog-title';
const bodyId = 'dialog-body';
const buttons = computed(() => [
  {
    accent: isDestructive.value ? Accent.Primary : Accent.Secondary,
    keys: ['Escape'],
    status: DialogStatus.Canceled,
    text: cancelText.value,
  },
  {
    accent: isDestructive.value ? Accent.Secondary : Accent.Primary,
    keys: ['Enter'],
    status: DialogStatus.Confirmed,
    text: confirmText.value,
  },
]);
function respond(status: DialogStatus): void {
  isRendered.value = false;
  dialogStore.resolve({ status });
}
function toggleExitAnimation(): void {
  exitAnimation.value = true;
  setTimeout(() => {
    exitAnimation.value = false;
  }, 250);
}
watch(html, newValue => {
  if (newValue !== null) isRendered.value = true;
});
</script>

<template>
  <section v-if="isRendered" class="dialog" @mousedown="toggleExitAnimation">
    <dialog
      open
      role="alertdialog"
      :aria-labelledby="title === null ? undefined : titleId"
      :aria-describedby="bodyId"
      :class="{ dialog__window: true, 'dialog__window--shaking': exitAnimation }"
      @mousedown.stop
    >
      <div class="dialog__content">
        <h2 v-if="title" :id="titleId">{{ title }}</h2>
        <p :id="bodyId" class="app__make-secondary" v-html="html" />
      </div>
      <div class="dialog__footer">
        <AppButton
          v-for="button in buttons"
          :key="button.status"
          :accent="button.accent"
          :keys="button.keys"
          @click="respond(button.status)"
        >
          {{ button.text }}
        </AppButton>
      </div>
    </dialog>
  </section>
</template>

<style lang="scss" scoped>
@use '@/interface/assets/scss/themes' as *;
.dialog {
  @include dark-theme;
  @media (prefers-color-scheme: dark) {
    @include light-theme;
  }
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: var(--z-index-level-2);
  display: grid;
  place-items: center;
  &__window {
    background: var(--primary-bg);
    border-radius: var(--dialog-radius);
    color: var(--primary-color);
    padding: var(--space-xl);
    border: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-2xl);
    box-shadow: var(--shadow-2xl);
    max-width: min(28rem, calc(100vw - 2 * var(--space-l)));
    &--shaking {
      animation: horizontal-shake var(--transition-duration) linear forwards;
    }
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
