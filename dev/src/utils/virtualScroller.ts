/**
 * Virtual Scroller utility
 * Efficiently renders large lists by only rendering visible items
 */

export interface VirtualScrollerConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number; // Number of items to render outside visible area
}

export class VirtualScroller<T> {
  private items: T[] = [];
  private config: Required<VirtualScrollerConfig>;
  private scrollTop: number = 0;

  constructor(config: VirtualScrollerConfig) {
    this.config = {
      ...config,
      bufferSize: config.bufferSize || 5
    };
  }

  setItems(items: T[]): void {
    this.items = items;
  }

  setScrollTop(scrollTop: number): void {
    this.scrollTop = Math.max(0, scrollTop);
  }

  /**
   * Get the range of items that should be rendered
   */
  getVisibleRange(): { startIndex: number; endIndex: number; totalHeight: number } {
    const visibleCount = Math.ceil(this.config.containerHeight / this.config.itemHeight);
    const startIndex = Math.max(
      0,
      Math.floor(this.scrollTop / this.config.itemHeight) - this.config.bufferSize
    );
    const endIndex = Math.min(
      this.items.length,
      startIndex + visibleCount + this.config.bufferSize * 2
    );

    return {
      startIndex,
      endIndex,
      totalHeight: this.items.length * this.config.itemHeight
    };
  }

  /**
   * Get visible items
   */
  getVisibleItems(): T[] {
    const { startIndex, endIndex } = this.getVisibleRange();
    return this.items.slice(startIndex, endIndex);
  }

  /**
   * Get offset for rendering (top position)
   */
  getOffset(): number {
    const { startIndex } = this.getVisibleRange();
    return startIndex * this.config.itemHeight;
  }

  /**
   * Create virtual scroller HTML element
   */
  createScrollContainer(
    renderItem: (item: T, index: number) => HTMLElement
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "virtual-scroller-container";
    container.style.height = `${this.config.containerHeight}px`;
    container.style.overflow = "auto";
    container.style.position = "relative";

    const viewport = document.createElement("div");
    viewport.className = "virtual-scroller-viewport";
    viewport.style.height = `${this.getVisibleRange().totalHeight}px`;
    viewport.style.position = "relative";

    const content = document.createElement("div");
    content.className = "virtual-scroller-content";
    content.style.transform = `translateY(${this.getOffset()}px)`;
    content.style.position = "absolute";
    content.style.top = "0";
    content.style.left = "0";
    content.style.right = "0";

    const { startIndex } = this.getVisibleRange();
    const visibleItems = this.getVisibleItems();

    visibleItems.forEach((item, index) => {
      const element = renderItem(item, startIndex + index);
      element.style.height = `${this.config.itemHeight}px`;
      content.appendChild(element);
    });

    viewport.appendChild(content);
    container.appendChild(viewport);

    // Add scroll listener
    container.addEventListener("scroll", () => {
      this.setScrollTop(container.scrollTop);
    });

    return container;
  }
}
