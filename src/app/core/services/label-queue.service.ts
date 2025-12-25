import { Injectable, signal, computed } from '@angular/core';
import { LabelQueueItem } from '../models/label-queue.model';

const STORAGE_KEY = 'homely_label_queue';

@Injectable({
  providedIn: 'root',
})
export class LabelQueueService {
  private queue = signal<LabelQueueItem[]>([]);

  allItems = computed(() => this.queue());
  pendingItems = computed(() => this.queue().filter((item) => !item.printed));
  printedItems = computed(() => this.queue().filter((item) => item.printed));
  pendingCount = computed(() => this.pendingItems().length);
  totalLabelsCount = computed(() =>
    this.pendingItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.queue.set(JSON.parse(stored));
      } catch {
        this.queue.set([]);
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue()));
  }

  private generateId(): string {
    return `lq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Add a single item to the queue
   */
  addToQueue(cid: string, name: string, quantity: number = 1): LabelQueueItem {
    const item: LabelQueueItem = {
      id: this.generateId(),
      cid,
      name,
      quantity,
      addedAt: new Date().toISOString(),
      printed: false,
    };

    this.queue.update((items) => [...items, item]);
    this.saveToStorage();
    return item;
  }

  /**
   * Add multiple CIDs to the queue at once
   */
  addBatchToQueue(
    items: { cid: string; name: string; quantity?: number }[]
  ): LabelQueueItem[] {
    const newItems: LabelQueueItem[] = items.map((item) => ({
      id: this.generateId(),
      cid: item.cid,
      name: item.name,
      quantity: item.quantity || 1,
      addedAt: new Date().toISOString(),
      printed: false,
    }));

    this.queue.update((existing) => [...existing, ...newItems]);
    this.saveToStorage();
    return newItems;
  }

  /**
   * Update quantity for a queue item
   */
  updateQuantity(id: string, quantity: number): void {
    this.queue.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
    this.saveToStorage();
  }

  /**
   * Mark item(s) as printed
   */
  markAsPrinted(ids: string[]): void {
    this.queue.update((items) =>
      items.map((item) =>
        ids.includes(item.id) ? { ...item, printed: true } : item
      )
    );
    this.saveToStorage();
  }

  /**
   * Mark all pending items as printed
   */
  markAllAsPrinted(): void {
    this.queue.update((items) =>
      items.map((item) => ({ ...item, printed: true }))
    );
    this.saveToStorage();
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(id: string): void {
    this.queue.update((items) => items.filter((item) => item.id !== id));
    this.saveToStorage();
  }

  /**
   * Remove multiple items from queue
   */
  removeMultiple(ids: string[]): void {
    this.queue.update((items) =>
      items.filter((item) => !ids.includes(item.id))
    );
    this.saveToStorage();
  }

  /**
   * Clear all printed items
   */
  clearPrinted(): void {
    this.queue.update((items) => items.filter((item) => !item.printed));
    this.saveToStorage();
  }

  /**
   * Clear entire queue
   */
  clearAll(): void {
    this.queue.set([]);
    this.saveToStorage();
  }

  /**
   * Get item by ID
   */
  getById(id: string): LabelQueueItem | undefined {
    return this.queue().find((item) => item.id === id);
  }

  /**
   * Check if a CID is already in the queue
   */
  isInQueue(cid: string): boolean {
    return this.queue().some((item) => item.cid === cid && !item.printed);
  }
}
