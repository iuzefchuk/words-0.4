<script lang="ts" setup>
import { computed, inject, Ref } from 'vue';
import { GameBonus, GameCell } from '@/application/types/index.ts';
import AppCell from '@/interface/components/shared/AppCell/AppCell.vue';
import AppTile from '@/interface/components/shared/AppTile/AppTile.vue';
import { Accent, LabeledElement } from '@/interface/enums.ts';
import { handleClickGridCell, handleClickGridTile, handleDoubleClickGridTile } from '@/interface/handlers/grid.ts';
import { getBonusLabel, getBonusName, getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const props = defineProps<{
  cell: GameCell;
  index: number;
}>();
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const cellRole = inject<string>('cellRole');
if (cellRole === undefined) throw new Error('LayoutGridItem: cellRole must be provided');
const focusedItemIndex = inject<Ref<number>>('focusedItemIndex');
const BONUS_ACCENT: Readonly<Record<GameBonus, Accent>> = {
  [GameBonus.DoubleLetter]: Accent.Quaternary,
  [GameBonus.DoubleWord]: Accent.Secondary,
  [GameBonus.TripleLetter]: Accent.Tertiary,
  [GameBonus.TripleWord]: Accent.Primary,
};
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
const bonusProp = computed(() =>
  bonus.value === null ? undefined : { accent: BONUS_ACCENT[bonus.value], name: getBonusName(bonus.value) },
);
const pressedState = computed(() => (tile.value === undefined ? undefined : tileIsSelected.value));
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
  if (tile.value !== undefined) handleClickGridTile(tile.value);
  else handleClickGridCell(props.cell);
}
function doubleActivate(): void {
  if (tile.value !== undefined) handleDoubleClickGridTile(tile.value);
}
</script>

<template>
  <AppCell
    v-memo="[tile, bonus, tileAccent, tileIsSelected, isFocused]"
    :cell-role="cellRole"
    :row-index="mainStore.getCellRowIndex(cell) + 1"
    :col-index="mainStore.getCellColumnIndex(cell) + 1"
    :is-focused="isFocused"
    :is-highlighted="isCenter"
    :is-occupied="tile !== undefined"
    :is-pressed="pressedState"
    :aria-label="ariaLabel"
    :bonus="bonusProp"
    @activate="activate"
    @double-activate="doubleActivate"
  >
    <Transition name="fade" appear>
      <AppTile v-if="tile && tileAccent" :letter="mainStore.getTileLetter(tile)" :accent="tileAccent" />
    </Transition>
  </AppCell>
</template>
