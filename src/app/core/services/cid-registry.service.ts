import { Injectable, signal, computed } from '@angular/core';
import { CidRegistryEntry } from '../models/label-queue.model';

const STORAGE_KEY = 'homely_cid_registry';

@Injectable({
  providedIn: 'root',
})
export class CidRegistryService {
  private registry = signal<CidRegistryEntry[]>([]);

  allCids = computed(() => this.registry());
  cidCount = computed(() => this.registry().length);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.registry.set(JSON.parse(stored));
      } catch {
        this.registry.set([]);
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.registry()));
  }

  /**
   * Check if a CID already exists in the registry
   */
  exists(cid: string): boolean {
    return this.registry().some((entry) => entry.cid === cid);
  }

  /**
   * Register a new CID
   */
  register(cid: string, name: string, itemId?: number): boolean {
    if (this.exists(cid)) {
      return false;
    }

    this.registry.update((entries) => [
      ...entries,
      {
        cid,
        name,
        itemId,
        createdAt: new Date().toISOString(),
      },
    ]);
    this.saveToStorage();
    return true;
  }

  /**
   * Register multiple CIDs at once
   */
  registerBatch(
    cids: { cid: string; name: string; itemId?: number }[]
  ): { success: string[]; duplicates: string[] } {
    const success: string[] = [];
    const duplicates: string[] = [];

    for (const { cid, name, itemId } of cids) {
      if (this.exists(cid)) {
        duplicates.push(cid);
      } else {
        this.registry.update((entries) => [
          ...entries,
          {
            cid,
            name,
            itemId,
            createdAt: new Date().toISOString(),
          },
        ]);
        success.push(cid);
      }
    }

    if (success.length > 0) {
      this.saveToStorage();
    }

    return { success, duplicates };
  }

  /**
   * Update the itemId for a CID after item creation
   */
  updateItemId(cid: string, itemId: number): void {
    this.registry.update((entries) =>
      entries.map((entry) =>
        entry.cid === cid ? { ...entry, itemId } : entry
      )
    );
    this.saveToStorage();
  }

  /**
   * Remove a CID from the registry
   */
  unregister(cid: string): void {
    this.registry.update((entries) =>
      entries.filter((entry) => entry.cid !== cid)
    );
    this.saveToStorage();
  }

  /**
   * Generate the next available sequential CID based on a prefix
   * E.g., if prefix is "CBAXL" and "CBAXL71" exists, returns "CBAXL72"
   */
  getNextSequentialCid(prefix: string, suffixLength: number = 2): string {
    const existingWithPrefix = this.registry()
      .filter((entry) => entry.cid.startsWith(prefix))
      .map((entry) => {
        const suffix = entry.cid.slice(prefix.length);
        return parseInt(suffix, 36) || 0;
      });

    const maxNum = existingWithPrefix.length > 0 ? Math.max(...existingWithPrefix) : 0;
    const nextNum = maxNum + 1;

    // Convert to base36 and pad
    const suffix = nextNum.toString(36).toUpperCase().padStart(suffixLength, '0');
    return `${prefix}${suffix}`;
  }

  /**
   * Generate a batch of sequential CIDs
   */
  generateSequentialCids(prefix: string, count: number, suffixLength: number = 2): string[] {
    const cids: string[] = [];
    const existingWithPrefix = this.registry()
      .filter((entry) => entry.cid.startsWith(prefix))
      .map((entry) => {
        const suffix = entry.cid.slice(prefix.length);
        return parseInt(suffix, 36) || 0;
      });

    let nextNum = existingWithPrefix.length > 0 ? Math.max(...existingWithPrefix) + 1 : 1;

    for (let i = 0; i < count; i++) {
      const suffix = nextNum.toString(36).toUpperCase().padStart(suffixLength, '0');
      cids.push(`${prefix}${suffix}`);
      nextNum++;
    }

    return cids;
  }

  /**
   * Get entry by CID
   */
  getByCid(cid: string): CidRegistryEntry | undefined {
    return this.registry().find((entry) => entry.cid === cid);
  }

  /**
   * Search CIDs by prefix or name
   */
  search(query: string): CidRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.registry().filter(
      (entry) =>
        entry.cid.toLowerCase().includes(lowerQuery) ||
        entry.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all entries (use with caution)
   */
  clearAll(): void {
    this.registry.set([]);
    this.saveToStorage();
  }
}
