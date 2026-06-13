<script lang="ts" setup>
import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import AppRadioGroup from '@/interface/components/app/AppRadioGroup.vue';
import { handleChangeMatchDifficulty, handleChangeMatchType } from '@/interface/handlers/setup.ts';
import MainStore from '@/interface/stores/MainStore.ts';
type OptionValue = GameMatchDifficulty | GameMatchType;
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <form class="setup" aria-label="Match setup" @submit.prevent>
    <AppRadioGroup
      v-for="{ items, legend, modelValue, onChange } in [
        {
          items: [
            { text: text('settings.difficulty_low'), value: GameMatchDifficulty.Low },
            { text: text('settings.difficulty_medium'), value: GameMatchDifficulty.Medium },
            { text: text('settings.difficulty_high'), value: GameMatchDifficulty.High },
          ],
          legend: text('settings.difficulty'),
          modelValue: () => mainStore.matchDifficulty,
          onChange: (value: OptionValue) => {
            handleChangeMatchDifficulty(value as GameMatchDifficulty);
          },
        },
        {
          items: [
            { text: text('settings.bonus_distribution_classic'), value: GameMatchType.Classic },
            { text: text('settings.bonus_distribution_random'), value: GameMatchType.Random },
          ],
          legend: text('settings.bonuses'),
          modelValue: () => mainStore.matchType,
          onChange: (value: OptionValue) => {
            handleChangeMatchType(value as GameMatchType);
          },
        },
      ]"
      :key="legend"
      :legend="legend"
      :model-value="modelValue()"
      :options="items"
      @change="onChange"
    />
  </form>
</template>

<style lang="scss" scoped>
.setup {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}
</style>
