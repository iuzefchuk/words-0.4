<script lang="ts" setup>
import { GameMatchDifficulty, GameMatchType } from '@/application/types/index.ts';
import AppRadioGroup from '@/interface/components/app/AppRadioGroup.vue';
import { handleChangeMatchDifficulty, handleChangeMatchType } from '@/interface/handlers/setup.ts';
import useLocalesNamespace from '@/interface/composables/UseLocalesNamespace.ts';
import MainStore from '@/interface/stores/MainStore.ts';
const { t } = useLocalesNamespace('settings');
type OptionValue = GameMatchDifficulty | GameMatchType;
const mainStore = MainStore.INSTANCE();
</script>

<template>
  <form class="setup" aria-label="Match setup" @submit.prevent>
    <AppRadioGroup
      v-for="{ items, legend, modelValue, onChange } in [
        {
          items: [
            { text: t('difficulty_low'), value: GameMatchDifficulty.Low },
            { text: t('difficulty_medium'), value: GameMatchDifficulty.Medium },
            { text: t('difficulty_high'), value: GameMatchDifficulty.High },
          ],
          legend: t('difficulty'),
          modelValue: () => mainStore.matchDifficulty,
          onChange: (value: OptionValue) => {
            handleChangeMatchDifficulty(value as GameMatchDifficulty);
          },
        },
        {
          items: [
            { text: t('bonus_distribution_classic'), value: GameMatchType.Classic },
            { text: t('bonus_distribution_random'), value: GameMatchType.Random },
          ],
          legend: t('bonuses'),
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
