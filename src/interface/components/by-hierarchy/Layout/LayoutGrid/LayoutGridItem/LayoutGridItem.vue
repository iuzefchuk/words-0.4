<script lang="ts" setup>
import { computed, inject, Ref } from 'vue';
import { GameCell } from '@/application/types/index.ts';
import AppCell from '@/interface/components/shared/AppCell/AppCell.vue';
import AppTile from '@/interface/components/shared/AppTile/AppTile.vue';
import { Accent, LabeledElement } from '@/interface/enums.ts';
import { handleClickGridCell, handleClickGridTile, handleDoubleClickGridTile } from '@/interface/handlers/grid/grid.ts';
import { getBonusLabel, getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore/MainStore.ts';
import UserStore from '@/interface/stores/UserStore/UserStore.ts';
const props = defineProps<{
  cell: GameCell;
  index: number;
}>();
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const role = inject<string>('cellRole');
if (role === undefined) throw new Error('LayoutGridItem: cellRole must be provided');
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
const label = computed(() => {
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
    :role="role"
    :row-index="mainStore.getCellRowIndex(cell) + 1"
    :col-index="mainStore.getCellColumnIndex(cell) + 1"
    :is-focused="isFocused"
    :is-highlighted="isCenter"
    :is-occupied="tile !== undefined"
    :label="label"
    :bonus="bonus"
    @activate="activate"
    @double-activate="doubleActivate"
  >
    <Transition name="fade" appear>
      <AppTile v-if="tile && tileAccent" :letter="mainStore.getTileLetter(tile)" :accent="tileAccent" />
    </Transition>
  </AppCell>
</template>
