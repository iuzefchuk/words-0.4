<script lang="ts" setup>
import { computed } from 'vue';
import { GameBonusDistribution, GameDifficulty } from '@/application/types.ts';
import AppSelect from '@/presentation/components/shared/AppSelect/AppSelect.vue';
import MainStore from '@/presentation/stores/MainStore.ts';
type OptionValue = GameBonusDistribution | GameDifficulty;
const mainStore = MainStore.INSTANCE();
const optionsAreDisabled = computed(() => !mainStore.settingsChangeIsAllowed);
const options = [
  {
    items: [
      { text: window.t('game.bonus_distribution_classic'), value: GameBonusDistribution.Classic },
      { text: window.t('game.bonus_distribution_random'), value: GameBonusDistribution.Random },
    ],
    label: window.t('game.settings_bonuses'),
    modelValue: () => mainStore.boardType,
    onChange: (value: OptionValue) => mainStore.changeBoardType(value as GameBonusDistribution),
  },
  {
    items: [
      { text: window.t('game.difficulty_low'), value: GameDifficulty.Low },
      { text: window.t('game.difficulty_medium'), value: GameDifficulty.Medium },
      { text: window.t('game.difficulty_high'), value: GameDifficulty.High },
    ],
    label: window.t('game.settings_difficulty'),
    modelValue: () => mainStore.difficulty,
    onChange: (value: OptionValue) => mainStore.changeDifficulty(value as GameDifficulty),
  },
];
const players = [
  {
    name: window.t('game.player_user'),
    score: () => mainStore.userScore,
  },
  {
    name: window.t('game.player_opponent'),
    score: () => mainStore.opponentScore,
  },
];
</script>

<template>
  <header class="header">
    <template v-if="optionsAreDisabled">
      <p v-for="player in players" :key="player.name">{{ player.name }}: <span v-animate-number="{ number: player.score() }" /></p>
    </template>
    <template v-else>
      <p v-for="{ items, label, modelValue, onChange } in options" :key="label">
        {{ label }}:
        <AppSelect :model-value="modelValue()" :options="items" :is-disabled="false" @change="onChange" />
      </p>
    </template>
  </header>
</template>

<style lang="scss" scoped>
.header {
  width: 100%;
  z-index: var(--z-index-level-2);
  padding: var(--primary-padding) 0;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
</style>
