<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { GameTile } from '@/application/types/index.ts';
import AppTile from '@/interface/components/app/AppTile.vue';
import LayoutFooterToolbarStats from '@/interface/components/by-hierarchy/Layout/LayoutFooter/LayoutFooterToolbar/LayoutFooterToolbarStats.vue';
import { Accent } from '@/interface/enums.ts';
import { handleClickToolbarCell, handleClickToolbarTile } from '@/interface/handlers/toolbar.ts';
import MainStore from '@/interface/stores/MainStore.ts';
import UserStore from '@/interface/stores/UserStore.ts';
const mainStore = MainStore.INSTANCE();
const userStore = UserStore.INSTANCE();
const { allActionsAreDisabled } = storeToRefs(mainStore);
const { tiles } = storeToRefs(userStore);

const paddedTiles = computed<Array<GameTile | null>>(() =>
  Array.from({ length: mainStore.tilesPerPlayer }, (_, idx) => tiles.value[idx] ?? null),
);

function onClickTile(idx: number, tile: GameTile | null): void {
  if (tile === null) return;
  if (mainStore.isTilePlaced(tile)) {
    handleClickToolbarCell(idx);
    return;
  }
  handleClickToolbarTile(tile);
}
</script>

<template>
  <section class="toolbar" role="toolbar">
    <ul class="toolbar__grid app__create-grid--for-footer-toolbar">
      <li v-for="(tile, idx) in paddedTiles" :key="idx" class="toolbar__cell">
        <button
          type="button"
          class="toolbar__button"
          :disabled="allActionsAreDisabled || tile === null"
          @click.stop="onClickTile(idx, tile)"
        >
          <AppTile
            v-if="tile !== null && userStore.isTileInToolbar(tile) && !mainStore.isTilePlaced(tile)"
            :letter="mainStore.getTileLetter(tile)"
            :accent="userStore.isTileSelected(tile) ? Accent.Primary : Accent.Tertiary"
            :points="mainStore.getLetterPoints(mainStore.getTileLetter(tile))"
          />
        </button>
      </li>
      <li role="none">
        <LayoutFooterToolbarStats />
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
@use '@style/breakpoints.scss' as *;
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  max-width: $breakpoint-mobile;
  width: 100%;
  padding: calc(var(--layout-padding) * 2) var(--layout-padding) 0;
  &__grid {
    width: 100%;
  }
  &__cell {
    background: var(--toolbar-cell-bg);
    border-radius: calc(var(--grid-item-radius) * 2);
    box-shadow: var(--toolbar-cell-shadow);
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
}
</style>
