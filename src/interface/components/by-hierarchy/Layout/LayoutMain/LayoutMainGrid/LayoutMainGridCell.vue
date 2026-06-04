<script lang="ts" setup>
import { computed, inject } from 'vue';
import AppCell from '@/interface/components/app/AppCell.vue';
import AppTile from '@/interface/components/app/AppTile.vue';
import { Accent } from '@/interface/enums.ts';
import { handleDoublePressGridTile, handlePressGridCell, handlePressGridTile } from '@/interface/handlers/grid.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
import type { GameCell } from '@/application/types/index.ts';
import type { Ref } from 'vue';
const props = defineProps<{
  cell: GameCell;
  index: number;
}>();
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
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

function activate(): void {
  if (tile.value !== undefined) handlePressGridTile(tile.value);
  else handlePressGridCell(props.cell);
}

function doubleActivate(): void {
  if (tile.value !== undefined) handleDoublePressGridTile(tile.value);
}
</script>

<template>
  <AppCell
    v-memo="[tile, bonus, tileAccent, tileIsSelected, isFocused]"
    :row-index="mainStore.getCellRowIndex(cell) + 1"
    :col-index="mainStore.getCellColumnIndex(cell) + 1"
    :is-focused="isFocused"
    :is-highlighted="isCenter"
    :is-occupied="tile !== undefined"
    :bonus="bonus"
    @activate="activate"
    @double-activate="doubleActivate"
  >
    <Transition name="fade" appear>
      <AppTile
        v-if="tile && tileAccent"
        :letter="mainStore.getTileLetter(tile)"
        :accent="tileAccent"
        :points="mainStore.getLetterPoints(mainStore.getTileLetter(tile))"
      />
    </Transition>
  </AppCell>
</template>
