<script lang="ts" setup>
import { computed } from 'vue';
import { GameBonus, GameCell } from '@/application/types/index.ts';
import GameTile from '@/presentation/components/shared/AppTile/AppTile.vue';
import UseInventoryEvents from '@/presentation/composables/UseInventoryEvents.ts';
import { getBonusName } from '@/presentation/mappings.ts';
import InventoryStore from '@/presentation/stores/InventoryStore.ts';
import MainStore from '@/presentation/stores/MainStore.ts';
const inventoryEvents = new UseInventoryEvents();
const props = defineProps<{
  cell: GameCell;
}>();
const mainStore = MainStore.INSTANCE();
const inventoryStore = InventoryStore.INSTANCE();
const isCellCenter = computed(() => mainStore.isCellCenter(props.cell));
const bonus = computed(() => mainStore.getCellBonus(props.cell));
const bonusName = computed(() => (bonus.value ? getBonusName(bonus.value) : ''));
const tile = computed(() => mainStore.findTileOnCell(props.cell));
const isTileSaturated = computed(() => tile.value != null && mainStore.wasTileUsedInPreviousTurn(tile.value));
</script>

<template>
  <li
    :class="{
      cell: true,
      'cell--center': isCellCenter,
      'cell--has-tile': tile,
    }"
    @click.stop="inventoryEvents.handleClickBoardCell(cell)"
  >
    <Transition name="fade" appear>
      <svg
        v-if="bonus"
        :class="{
          cell__bonus: true,
          'cell__bonus--dw': bonus === GameBonus.DoubleWord,
          'cell__bonus--tw': bonus === GameBonus.TripleWord,
          'cell__bonus--dl': bonus === GameBonus.DoubleLetter,
          'cell__bonus--tl': bonus === GameBonus.TripleLetter,
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
      <GameTile
        v-if="tile"
        :letter="mainStore.getTileLetter(tile)"
        :is-inverted="inventoryStore.isTileSelected(tile)"
        :is-saturated="isTileSaturated"
        @click.stop="inventoryEvents.handleClickBoardTile(tile)"
        @dblclick.stop="inventoryEvents.handleDoubleClickBoardTile(tile)"
      />
    </Transition>
  </li>
</template>

<style lang="scss" scoped>
.cell {
  max-width: var(--cell-tile-width);
  border-radius: var(--cell-tile-border-radius);
  background: var(--cell-bg);
  user-select: none;
  box-shadow: var(--cell-shadow);
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
    z-index: var(--z-index-level-1);
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
