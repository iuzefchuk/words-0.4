<script lang="ts" setup>
import { computed, inject, Ref } from 'vue';
import { GameBonus, GameCell } from '@/application/types/index.ts';
import AppTile from '@/interface/components/shared/AppTile/AppTile.vue';
import UseEventHandlers from '@/interface/composables/UseEventHandlers.ts';
import { Accent, LabeledElement } from '@/interface/enums.ts';
import { getBonusLabel, getBonusName, getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const props = defineProps<{
  cell: GameCell;
  index: number;
}>();
const eventHandlers = new UseEventHandlers();
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const cellRole = inject<string>('cellRole');
if (cellRole === undefined) throw new Error('LayoutGridItem: cellRole must be provided');
const focusedItemIndex = inject<Ref<number>>('focusedItemIndex');
const isCenter = computed(() => mainStore.isCellCenter(props.cell));
const bonus = computed(() => mainStore.getCellBonus(props.cell));
const tile = computed(() => mainStore.findTileOnCell(props.cell));
const tileIsSelected = computed(() => tile.value !== undefined && userStore.isTileSelected(tile.value));
const tileAccent = computed(() => {
  if (tile.value === undefined) return null;
  if (tileIsSelected.value) return Accent.Primary;
  if (mainStore.wasTileUsedInPreviousTurn(tile.value)) return Accent.Secondary;
  return Accent.Tertiary;
});
const isFocused = computed(() => focusedItemIndex?.value === props.index);
const ariaLabel = computed(() => {
  if (tile.value !== undefined) {
    const letter = mainStore.getTileLetter(tile.value);
    return getElementLabel(LabeledElement.LayoutGridItemTile, { letter, points: mainStore.getLetterPoints(letter) });
  }
  if (isCenter.value) return getElementLabel(LabeledElement.LayoutGridItemCellCenter);
  if (bonus.value !== null) {
    return getElementLabel(LabeledElement.LayoutGridItemCellWithBonus, { bonus: getElementLabel(getBonusLabel(bonus.value)) });
  }
  return undefined;
});

function activate(): void {
  if (tile.value !== undefined) eventHandlers.handleClickBoardTile(tile.value);
  else eventHandlers.handleClickBoardCell(props.cell);
}
</script>

<template>
  <div
    v-memo="[tile, bonus, tileAccent, tileIsSelected, isFocused]"
    :role="cellRole"
    :tabindex="isFocused ? 0 : -1"
    :aria-rowindex="mainStore.getCellRowIndex(cell) + 1"
    :aria-colindex="mainStore.getCellColumnIndex(cell) + 1"
    :aria-pressed="tile === undefined ? undefined : tileIsSelected"
    :aria-label="ariaLabel"
    :class="{
      item: true,
      'item--highlighted': isCenter,
      'item--occupied': tile !== undefined,
    }"
    @click.stop="activate"
    @keydown.enter.prevent.stop="activate"
    @dblclick.stop="tile !== undefined && eventHandlers.handleDoubleClickBoardTile(tile)"
  >
    <svg
      v-if="bonus"
      aria-hidden="true"
      :class="{
        item__bonus: true,
        'item__bonus--quaternary': bonus === GameBonus.DoubleLetter,
        'item__bonus--tertiary': bonus === GameBonus.TripleLetter,
        'item__bonus--secondary': bonus === GameBonus.DoubleWord,
        'item__bonus--primary': bonus === GameBonus.TripleWord,
      }"
      viewBox="0 0 40 40"
    >
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">{{ getBonusName(bonus) }}</text>
    </svg>
    <Transition name="fade" appear>
      <AppTile
        v-if="tile && tileAccent"
        aria-hidden="true"
        :letter="mainStore.getTileLetter(tile)"
        :accent="tileAccent"
        :is-disabled="!userStore.isTileInRack(tile)"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.item {
  max-width: var(--grid-item-size);
  border-radius: var(--grid-item-radius);
  background: var(--cell-bg);
  user-select: none;
  box-shadow: var(--cell-shadow);
  cursor: pointer;
  &--highlighted {
    background: var(--cell-bg-highlighted);
  }
  &--highlighted,
  &--occupied {
    box-shadow: none;
  }
  &__bonus {
    font-weight: var(--font-weight-big);
    z-index: var(--z-index-level-1);
    opacity: var(--cell-opacity-bonus);
    font-size: 15px;
    $accents: 'primary', 'secondary', 'tertiary', 'quaternary';
    @each $accent in $accents {
      &--#{$accent} text {
        fill: var(--cell-color-#{$accent});
      }
    }
  }
}
</style>
