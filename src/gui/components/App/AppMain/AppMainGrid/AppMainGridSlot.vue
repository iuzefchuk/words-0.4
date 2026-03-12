<script lang="ts" setup>
import AppItem from '@/gui/components/shared/AppItem.vue';
import { GameCell } from '@/application/types.ts';
import { PropType, computed } from 'vue';
import { useStoreGame } from '@/gui/stores/GameStore.ts';
import { useStoreInventory } from '@/gui/stores/ItemsStore.ts';
import { getBonusName } from '@/gui/mappings.ts';

// TODO
const props = defineProps({
  cell: { type: Object as PropType<GameCell>, required: true },
});
const storeGame = useStoreGame();
const storeItems = useStoreInventory();
const bonus = computed(() => {
  return storeGame.getCellBonus(props.cell);
});
const bonusName = computed(() => {
  return bonus.value ? getBonusName(bonus.value) : '';
});
const tile = computed(() => {
  return storeGame.findTileConnectedToCell(props.cell);
});
const tileLetter = computed(() => {
  return tile.value ? storeGame.getTileLetter(tile.value) : '';
});
</script>

<template>
  <li
    :class="{ cell: true, 'cell--center': storeGame.isCellInCenterOfLayout(cell), 'cell--has-tile': tile }"
    @click="storeItems.handleClickBoardCell(cell)"
  >
    <Transition name="fade" appear>
      <svg
        v-if="bonus"
        :class="{
          cell__bonus: true,
          'cell__bonus--dw': bonus === bonuses.DoubleWord,
          'cell__bonus--tw': bonus === bonuses.TripleWord,
          'cell__bonus--dl': bonus === bonuses.DoubleLetter,
          'cell__bonus--tl': bonus === bonuses.TripleLetter,
        }"
        class="cell__bonus"
        viewBox="0 0 40 40"
      >
        <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle">
          {{ bonusName }}
        </text>
      </svg>
    </Transition>
    <Transition name="fade" appear>
      <AppItem
        v-if="tile && tileLetter"
        class="cell__tile"
        :letter="tileLetter"
        :is-inverted="storeItems.isTileSelected(tile)"
        :is-highlighted="storeGame.wasTileUsedInLastTurn(tile)"
        :is-elevated="storeItems.isTileInInventory(tile)"
        @click.stop="storeItems.handleClickBoardTile(tile)"
      />
    </Transition>
    <slot />
  </li>
</template>

<style lang="scss" scoped>
.cell {
  max-width: var(--cell-tile-width);
  aspect-ratio: 1 / 1;
  border-radius: var(--primary-border-radius);
  background: var(--cell-bg);
  box-shadow: var(--box-shadow-level-0);
  user-select: none;
  cursor: pointer;
  &--center {
    background: var(--cell-bg-center);
  }
  &--center,
  &--has-tile {
    box-shadow: none;
  }
  &__bonus {
    font-weight: var(--font-weight-bigger);
    $bonuses: 'dw', 'tw', 'dl', 'tl';
    @each $bonus in $bonuses {
      &--#{$bonus} text {
        fill: var(--cell-color-#{$bonus});
      }
    }
  }
  &__tile {
    width: 100%;
    max-width: var(--cell-tile-width);
  }
}
</style>
