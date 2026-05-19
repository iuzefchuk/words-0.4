<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { LabeledElement } from '@/interface/enums.ts';
import { handleRestartGame } from '@/interface/handlers/restart/restart.ts';
import { getElementLabel, getMatchResultText } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const { matchResult, opponentScore, userScore } = storeToRefs(mainStore);
const resultText = computed(() => {
  // TODO change
  return getMatchResultText(matchResult.value, userScore.value - opponentScore.value);
});
const ariaLabel = computed(() => getElementLabel(LabeledElement.LayoutRestart, { result: resultText.value }));
function restart(): void {
  handleRestartGame();
}
</script>

<template>
  <div class="restart">
    <p role="status" class="app__make-sr-only">{{ resultText }}</p>
    <button class="restart__button" :aria-label="ariaLabel" @dblclick.stop="restart" @keydown.space.prevent.stop="restart">
      <span aria-hidden="true" class="restart__text">{{ resultText }}</span>
      <span aria-hidden="true" class="restart__hint app__make-secondary">{{ text('general.action_new_match') }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.restart {
  &__button {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: var(--z-index-level-3);
    display: grid;
    place-items: center;
    align-content: center;
    user-select: none;
    touch-action: manipulation;
  }
  &__hint {
    $ms: calc(var(--transition-duration) * 10);
    animation: double-tap $ms var(--transition-timing-function) infinite;
    animation-delay: $ms;
    transform-origin: center;
    position: absolute;
    bottom: 45%;
    width: max-content;
  }
}
</style>
