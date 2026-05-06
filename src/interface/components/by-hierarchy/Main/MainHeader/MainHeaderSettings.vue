<script lang="ts" setup>
import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import AppRadioGroup from '@/interface/components/shared/AppRadioGroup/AppRadioGroup.vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import MainStore from '@/interface/stores/MainStore.ts';
type OptionValue = GameMatchDifficulty | GameMatchType;
const mainStore = MainStore.INSTANCE();
const eventHandlers = new UseEventHandlers();
const options = [
  {
    items: [
      { text: window.text('general.difficulty_low'), value: GameMatchDifficulty.Low },
      { text: window.text('general.difficulty_medium'), value: GameMatchDifficulty.Medium },
      { text: window.text('general.difficulty_high'), value: GameMatchDifficulty.High },
    ],
    legend: window.text('general.settings_difficulty'),
    modelValue: () => mainStore.matchDifficulty,
    onChange: (value: OptionValue) => {
      eventHandlers.handleChangeMatchDifficulty(value as GameMatchDifficulty);
    },
  },
  {
    items: [
      { text: window.text('general.bonus_distribution_classic'), value: GameMatchType.Classic },
      { text: window.text('general.bonus_distribution_random'), value: GameMatchType.Random },
    ],
    legend: window.text('general.settings_bonuses'),
    modelValue: () => mainStore.matchType,
    onChange: (value: OptionValue) => {
      eventHandlers.handleChangeMatchType(value as GameMatchType);
    },
  },
];
</script>

<template>
  <section class="settings">
    <AppRadioGroup
      v-for="{ items, legend, modelValue, onChange } in options"
      :key="legend"
      :legend="legend"
      :model-value="modelValue()"
      :options="items"
      @change="onChange"
    />
  </section>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}
</style>
