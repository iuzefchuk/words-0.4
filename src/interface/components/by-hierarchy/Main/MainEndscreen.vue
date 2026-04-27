<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import { getMatchResultText } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const eventHandlers = UseEventHandlers.create();
const { matchResult, opponentScore, userScore } = storeToRefs(mainStore);
const resultText = computed(() => getMatchResultText(matchResult.value, userScore.value - opponentScore.value));
</script>

<template>
  <button class="endscreen" @dblclick="eventHandlers.handleRestartGame()">
    <p class="endscreen__text">{{ resultText }}</p>
    <p class="endscreen__hint app__make-secondary">{{ text('game.action_new_match') }}</p>
  </button>
</template>

<style lang="scss" scoped>
.endscreen {
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
