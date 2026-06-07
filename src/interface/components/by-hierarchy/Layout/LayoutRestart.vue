<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { handleRestartGame } from '@/interface/handlers/restart.ts';
import { getMatchResultText } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const ID_RESULT = 'result';
const mainStore = MainStore.INSTANCE();
const { matchResult, opponentScore, userScore } = storeToRefs(mainStore);
const result = computed(() => {
  // TODO change
  return getMatchResultText(matchResult.value, userScore.value - opponentScore.value);
});
function restart(): void {
  handleRestartGame();
}
</script>

<template>
  <section role="alertdialog" aria-modal="true" :aria-labelledby="ID_RESULT" class="restart">
    <p :id="ID_RESULT" role="status">{{ result }}</p>
    <button class="restart__button app__make-secondary" @dblclick.stop="restart" @keydown.space.prevent.stop="restart">
      {{ text('general.action_new_match') }}
    </button>
  </section>
</template>

<style lang="scss" scoped>
.restart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  left: 0;
  top: 0;

  &__button {
    display: grid;
    place-items: center;
    align-content: center;
    user-select: none;
    touch-action: manipulation;
    padding: var(--space-6xl);
    cursor: pointer;
  }
}
</style>
