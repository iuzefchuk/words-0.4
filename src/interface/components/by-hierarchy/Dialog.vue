<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { reactive, ref, watch } from 'vue';
import AppButton from '@/interface/components/shared/AppButton/AppButton.vue';
import { Accent } from '@/interface/enums.ts';
import DialogStore, { DialogStatus } from '@/interface/stores/DialogStore.ts';
const dialogStore = DialogStore.INSTANCE();
const { cancelText, confirmText, html, title } = storeToRefs(dialogStore);
const isRendered = ref(false);
const exitAnimation = ref(false);
const buttons = reactive([
  {
    accent: Accent.Secondary,
    keys: ['Escape'],
    status: DialogStatus.Canceled,
    text: () => cancelText.value,
  },
  {
    accent: Accent.Secondary,
    keys: ['Enter'],
    status: DialogStatus.Confirmed,
    text: () => confirmText.value,
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
    <dialog open :class="{ dialog__window: true, 'dialog__window--shaking': exitAnimation }" @mousedown.stop>
      <div class="dialog__content">
        <p v-if="title" class="dialog__content-title">{{ title }}</p>
        <p v-html="html" />
      </div>
      <div class="dialog__footer">
        <AppButton
          v-for="button in buttons"
          :key="button.status"
          :accent="button.accent"
          :keys="button.keys"
          @click="respond(button.status)"
        >
          {{ button.text() }}
        </AppButton>
      </div>
    </dialog>
  </section>
</template>

<style lang="scss" scoped>
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
    padding: var(--space-2xl) var(--space-xl);
    border: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--space-2xl);
    box-shadow: var(--shadow-2xl);
    &--shaking {
      animation: horizontal-shake var(--transition-duration) linear forwards;
    }
  }
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    font-size: var(--dialog-font-size);
    font-weight: var(--dialog-font-weight);
  }
  &__content-title {
    font-size: var(--dialog-title-font-size);
    font-weight: var(--dialog-title-font-weight);
  }
  &__footer {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: var(--space-s);
  }
}
</style>
