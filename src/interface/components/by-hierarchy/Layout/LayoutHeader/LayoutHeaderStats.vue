<script lang="ts" setup>
import { computed } from 'vue';
import useLocalesNamespace from '@/interface/composables/UseLocalesNamespace.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const { t } = useLocalesNamespace('game');
const mainStore = MainStore.INSTANCE();
const players = computed(() => [
  {
    name: t('player_user'),
    score: mainStore.userScore,
  },
  {
    name: t('player_opponent'),
    score: mainStore.opponentScore,
  },
]);
</script>

<template>
  <dl class="stats">
    <div v-for="player in players" :key="player.name" class="stats__row">
      <dt class="stats__title">{{ player.name }}:</dt>
      <dd class="stats__desc">
        <span class="app__make-sr-only">{{ player.score }}</span>
        <span v-animate-number="{ number: player.score }" aria-hidden="true" />
      </dd>
    </div>
  </dl>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: max-content;

  &__row {
    display: flex;
    flex-direction: row;
    gap: var(--space-xs);
  }
}
</style>
