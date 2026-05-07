<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { GameTile } from '@/application/types/index.ts';
import LayoutFooterRackAnnotation from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooterRack/LayoutFooterRackAnnotation.vue';
import AppTile from '@/interface/components/shared/AppTile/AppTile.vue';
import { Accent, LabeledElement } from '@/interface/enums.ts';
import { handleClickRackCell, handleClickRackTile } from '@/interface/handlers/rack.ts';
import { getElementLabel } from '@/interface/mappings.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const { allActionsAreDisabled } = storeToRefs(mainStore);
const { tiles } = storeToRefs(userStore);
const paddedTiles = computed<Array<GameTile | null>>(() =>
  Array.from({ length: mainStore.tilesPerPlayer }, (_, idx) => tiles.value[idx] ?? null),
);
function ariaLabelFor(tile: GameTile | null): string {
  if (tile === null) return getElementLabel(LabeledElement.LayoutFooterRackEmpty);
  const letter = mainStore.getTileLetter(tile);
  return getElementLabel(LabeledElement.LayoutFooterRackTile, { letter, points: mainStore.getLetterPoints(letter) });
}
function onTileClick(idx: number, tile: GameTile | null): void {
  if (tile === null) return;
  if (mainStore.isTilePlaced(tile)) {
    handleClickRackCell(idx);
    return;
  }
  handleClickRackTile(tile);
}
</script>

<template>
  <section class="rack app__limit-max-width" :aria-label="getElementLabel(LabeledElement.LayoutFooterRack)">
    <ul class="rack__grid app__create-grid--for-rack">
      <li v-for="(tile, idx) in paddedTiles" :key="idx" class="rack__cell">
        <button
          type="button"
          class="rack__button"
          :disabled="allActionsAreDisabled || tile === null"
          :aria-pressed="tile !== null && userStore.isTileSelected(tile)"
          :aria-label="ariaLabelFor(tile)"
          @click="onTileClick(idx, tile)"
        >
          <AppTile
            v-if="tile !== null && userStore.isTileInRack(tile) && !mainStore.isTilePlaced(tile)"
            aria-hidden="true"
            :letter="mainStore.getTileLetter(tile)"
            :accent="userStore.isTileSelected(tile) ? Accent.Primary : Accent.Tertiary"
          />
        </button>
      </li>
      <li role="none" class="rack__annotation">
        <LayoutFooterRackAnnotation />
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.rack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  &__grid {
    width: 100%;
  }
  &__cell {
    background: var(--rack-cell-bg);
    border-radius: calc(var(--grid-item-radius) * 2);
    box-shadow: var(--rack-cell-shadow);
  }
  &__button {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    border-radius: inherit;
    cursor: pointer;
    &:disabled {
      cursor: not-allowed;
    }
  }
  &__annotation {
    place-items: center;
  }
}
</style>
