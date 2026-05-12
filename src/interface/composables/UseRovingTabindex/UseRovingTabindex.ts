import { nextTick, Ref, ref } from 'vue';
import { Key } from '@/interface/enums.ts';

export default class UseRovingTabindex {
  readonly focusedIndex = ref(0);

  constructor(
    private readonly gridRef: Readonly<Ref<HTMLElement | null>>,
    private readonly itemSelector: string,
    private readonly itemsPerRow: number,
  ) {}

  readonly onKeydown = (event: KeyboardEvent): void => {
    const items = this.gridRef.value?.querySelectorAll<HTMLElement>(this.itemSelector);
    if (items === undefined) throw new Error(`UseRovingTabindex: gridRef is not mounted`);
    if (items.length === 0) throw new Error(`UseRovingTabindex: no items match "${this.itemSelector}"`);
    const total = items.length;
    let target = this.focusedIndex.value;
    switch (event.key as Key) {
      case Key.ArrowDown:
        target += this.itemsPerRow;
        break;
      case Key.ArrowLeft:
        target -= 1;
        break;
      case Key.ArrowRight:
        target += 1;
        break;
      case Key.ArrowUp:
        target -= this.itemsPerRow;
        break;
      case Key.End:
        target = total - 1;
        break;
      case Key.Home:
        target = 0;
        break;
      case Key.Enter:
      case Key.Escape:
      case Key.P:
      case Key.R:
      case Key.Space:
      default:
        return;
    }
    event.preventDefault();
    const clamped = Math.min(Math.max(target, 0), total - 1);
    if (clamped === this.focusedIndex.value) return;
    this.focusedIndex.value = clamped;
    void nextTick(() => {
      items[clamped]?.focus();
    });
  };
}
