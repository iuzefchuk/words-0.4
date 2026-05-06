<script lang="ts" setup>
import MainStore from '@/interface/stores/MainStore.ts';
const mainStore = MainStore.INSTANCE();
const players = [
  {
    name: window.text('general.player_user'),
    score: () => mainStore.userScore,
  },
  {
    name: window.text('general.player_opponent'),
    score: () => mainStore.opponentScore,
  },
];
</script>

<template>
  <section class="scoreline">
    <p v-for="player in players" :key="player.name">{{ player.name }}: <span v-animate-number="{ number: player.score() }" /></p>
  </section>
</template>

<style lang="scss" scoped>
.scoreline {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
</style>
