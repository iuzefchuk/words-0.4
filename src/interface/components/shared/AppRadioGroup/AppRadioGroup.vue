<script lang="ts" setup generic="T extends string">
import { nextTick, onMounted, ref, useId, useTemplateRef, watch } from 'vue';
const props = defineProps<{
  legend: string;
  modelValue: T;
  options: Array<{ text: string; value: T }>;
}>();
const emit = defineEmits<{
  change: [value: T];
}>();
const groupName = useId();
const labels = useTemplateRef<Array<HTMLLabelElement>>('labels');
const indicatorStyle = ref({ transform: 'translateX(0)', width: '0' });
const isReady = ref(false);
function updateIndicator(): void {
  const selectedIdx = props.options.findIndex(item => item.value === props.modelValue);
  const el = labels.value?.[selectedIdx];
  if (el === undefined) return;
  indicatorStyle.value = {
    transform: `translateX(${String(el.offsetLeft + 1)}px)`,
    width: `${String(el.offsetWidth - 1)}px`,
  };
}
onMounted(() => {
  void nextTick(() => {
    updateIndicator();
    isReady.value = true;
  });
});
watch(() => props.modelValue, updateIndicator, { flush: 'post' });
</script>

<template>
  <fieldset class="radio-group">
    <legend class="radio-group__legend app__make-secondary">{{ legend }}</legend>
    <div class="radio-group__option-group">
      <div v-if="isReady" class="radio-group__indicator" :style="indicatorStyle" />
      <label
        v-for="option in options"
        :key="option.value"
        ref="labels"
        :class="{
          'radio-group__option': true,
          'radio-group__option--selected': option.value === modelValue,
        }"
      >
        <input
          type="radio"
          class="radio-group__input"
          :name="groupName"
          :value="option.value"
          :checked="option.value === modelValue"
          @change="emit('change', option.value)"
        />
        {{ option.text }}
      </label>
    </div>
  </fieldset>
</template>

<style lang="scss" scoped>
.radio-group {
  &__legend {
    margin-block-end: var(--space-s);
    margin-left: var(--space-3xs);
    font-weight: var(--font-weight);
  }
  &__option-group {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    background: var(--radio-group-bg);
    border-radius: var(--space-s);
    padding: var(--space-3xs);
    gap: var(--space-3xs);
    height: var(--space-5xl);
  }
  &__indicator {
    position: absolute;
    top: var(--space-3xs);
    bottom: var(--space-3xs);
    left: 0;
    background: var(--radio-group-bg-selected);
    border-radius: calc(var(--space-xs) + 2px);
    pointer-events: none;
    transition-property: transform, width;
    transition-duration: var(--transition-duration);
    transition-timing-function: var(--transition-timing-function);
  }
  &__option {
    cursor: pointer;
    color: var(--radio-group-color);
    padding: var(--space-xs) var(--space-l);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight);
    user-select: none;
    transition-property: color;
    transition-duration: var(--transition-duration-half);
    transition-timing-function: var(--transition-timing-function);
    display: grid;
    place-items: center;
    position: relative;
    &:hover:not(.radio-group__option--selected) {
      color: var(--radio-group-color-hover);
    }
    &--selected {
      color: var(--radio-group-color-selected);
      cursor: default;
    }
    &:has(:focus-visible) {
      outline: 2px solid var(--radio-group-color-selected);
      outline-offset: -1px;
    }
  }
  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
