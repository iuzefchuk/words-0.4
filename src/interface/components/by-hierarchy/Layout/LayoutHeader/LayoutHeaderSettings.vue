<script lang="ts" setup>
import { DomainMatchDifficulty, DomainMatchType } from '@/app/enums/index.ts';
import AppRadioGroup from '@/interface/components/app/AppRadioGroup.vue';
import { handleChangeMatchDifficulty, handleChangeMatchType } from '@/interface/handlers/setup.ts';
import MainStore from '@/interface/stores/MainStore.ts';
type OptionValue = DomainMatchDifficulty | DomainMatchType;
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <form class="setup" aria-label="Match setup" @submit.prevent>
    <AppRadioGroup
      v-for="{ items, legend, modelValue, onChange } in [
        {
          items: [
            { text: text('general.difficulty_low'), value: DomainMatchDifficulty.Low },
            { text: text('general.difficulty_medium'), value: DomainMatchDifficulty.Medium },
            { text: text('general.difficulty_high'), value: DomainMatchDifficulty.High },
          ],
          legend: text('general.settings_difficulty'),
          modelValue: () => mainStore.matchDifficulty,
          onChange: (value: OptionValue) => {
            handleChangeMatchDifficulty(value as DomainMatchDifficulty);
          },
        },
        {
          items: [
            { text: text('general.bonus_distribution_classic'), value: DomainMatchType.Classic },
            { text: text('general.bonus_distribution_random'), value: DomainMatchType.Random },
          ],
          legend: text('general.settings_bonuses'),
          modelValue: () => mainStore.matchType,
          onChange: (value: OptionValue) => {
            handleChangeMatchType(value as DomainMatchType);
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
