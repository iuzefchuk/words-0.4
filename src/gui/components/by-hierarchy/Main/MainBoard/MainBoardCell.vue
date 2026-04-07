<script lang="ts" setup>
import { computed } from 'vue';
import { GameBonus, GameCell } from '@/application/types.ts';
import GameTile from '@/gui/components/shared/AppTile/AppTile.vue';
import { getBonusName } from '@/gui/mappings.ts';
import RackStore from '@/gui/stores/RackStore.ts';
import MainStore from '@/gui/stores/MainStore.ts';
const props = defineProps<{
  cell: GameCell;
}>();
const mainStore = MainStore.INSTANCE();
const rackStore = RackStore.INSTANCE();
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
    @click.stop="rackStore.handleClickBoardCell(cell)"
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
        :is-inverted="rackStore.isTileSelected(tile)"
        :is-saturated="isTileSaturated"
        @click.stop="rackStore.handleClickBoardTile(tile)"
        @dblclick.stop="rackStore.handleDoubleClickBoardTile(tile)"
      />
    </Transition>
  </li>
</template>

<style lang="scss" scoped>
.cell {
  max-width: var(--cell-tile-width);
  user-select: none;
  cursor: pointer;
  filter: drop-shadow(0 1px 2px var(--color-gray-faint));
  &::before {
    content: '';
    background: var(--cell-bg);
    clip-path: inset(0 round var(--primary-border-radius));
    grid-area: 1 / 1;
  }
  &--center::before {
    background: var(--cell-bg-center);
  }
  &--center,
  &--has-tile {
    filter: drop-shadow(1px transparent);
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
