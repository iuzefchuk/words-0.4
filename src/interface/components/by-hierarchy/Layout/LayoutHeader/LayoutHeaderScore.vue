<script lang="ts" setup>
import { computed } from 'vue';
import { LabeledElement } from '@/interface/enums.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const players = computed(() => [
  {
    name: window.text('general.player_user'),
    score: mainStore.userScore,
  },
  {
    name: window.text('general.player_opponent'),
    score: mainStore.opponentScore,
  },
]);
</script>

<template>
  <dl class="score">
    <div
      v-for="player in players"
      :key="player.name"
      class="score__row app__make-secondary"
      :aria-label="getElementLabel(LabeledElement.LayoutHeaderScore, { player: player.name })"
    >
      <dt class="score__title">{{ player.name }}</dt>
      <dd class="score__desc">
        <span v-animate-number="{ number: player.score }" aria-hidden="true" />
        <span class="app__make-sr-only">{{ player.score }}</span>
      </dd>
    </div>
  </dl>
</template>

<style lang="scss" scoped>
.score {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: max-content;
  &__row {
    display: flex;
    flex-direction: row;
    gap: var(--space-3xl);
    justify-content: space-between;
    &:first-child {
      border-bottom: 1px solid currentColor;
      padding-bottom: 4px;
    }
  }
}
</style>
