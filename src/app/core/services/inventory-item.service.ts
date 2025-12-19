import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import { InventoryItem, InventoryItemCreate, InventoryItemUpdate } from '../models';
import { environment } from '../../../environments/environment';

interface BaserowItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  images: string;
  current_location_id: number | null;
  tags: string;
  description: string;
  min_quantity: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryItemService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.items;

  private mapFromBaserow(row: BaserowItem): InventoryItem {
    let images: string[] = [];
    let tags: string[] = [];

    try {
      images = row.images ? JSON.parse(row.images) : [];
    } catch {
      images = row.images ? [row.images] : [];
    }

    try {
      tags = row.tags ? JSON.parse(row.tags) : [];
    } catch {
      tags = row.tags ? row.tags.split(',').map((t) => t.trim()) : [];
    }

    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity: row.quantity || 0,
      images,
      currentLocationId: row.current_location_id,
      tags,
      description: row.description || '',
      minQuantity: row.min_quantity || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToBaserow(data: InventoryItemCreate | InventoryItemUpdate): Partial<BaserowItem> {
    const mapped: Partial<BaserowItem> = {};
    if ('name' in data && data.name !== undefined) mapped.name = data.name;
    if ('sku' in data && data.sku !== undefined) mapped.sku = data.sku;
    if ('quantity' in data && data.quantity !== undefined) mapped.quantity = data.quantity;
    if ('images' in data && data.images !== undefined) mapped.images = JSON.stringify(data.images);
    if ('currentLocationId' in data) mapped.current_location_id = data.currentLocationId ?? null;
    if ('tags' in data && data.tags !== undefined) mapped.tags = JSON.stringify(data.tags);
    if ('description' in data && data.description !== undefined)
      mapped.description = data.description;
    if ('minQuantity' in data && data.minQuantity !== undefined)
      mapped.min_quantity = data.minQuantity;
    return mapped;
  }

  getAll(options?: BaserowQueryOptions): Observable<InventoryItem[]> {
    return this.baserow
      .getAll<BaserowItem>(this.tableId, options)
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<InventoryItem> {
    return this.baserow
      .getById<BaserowItem>(this.tableId, id)
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  getByLocationId(locationId: number): Observable<InventoryItem[]> {
    return this.baserow
      .getAll<BaserowItem>(this.tableId, {
        filters: [{ field: 'current_location_id', type: 'equal', value: locationId }],
      })
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getBySku(sku: string): Observable<InventoryItem | undefined> {
    return this.baserow
      .getAll<BaserowItem>(this.tableId, {
        filters: [{ field: 'sku', type: 'equal', value: sku }],
        size: 1,
      })
      .pipe(
        map((res) => res.results[0]),
        map((r) => (r ? this.mapFromBaserow(r) : undefined))
      );
  }

  create(data: InventoryItemCreate): Observable<InventoryItem> {
    return this.baserow
      .create<BaserowItem>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  update(id: number, data: InventoryItemUpdate): Observable<InventoryItem> {
    return this.baserow
      .update<BaserowItem>(this.tableId, id, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  delete(id: number): Observable<void> {
    return this.baserow.delete(this.tableId, id);
  }

  adjustQuantity(id: number, adjustment: number): Observable<InventoryItem> {
    return this.getById(id).pipe(
      map((item) => ({ quantity: item.quantity + adjustment })),
      map((update) => this.update(id, update)),
      (obs) => obs.pipe(map((inner) => inner)),
      (obs) =>
        new Observable<InventoryItem>((subscriber) => {
          this.getById(id).subscribe({
            next: (item) => {
              this.update(id, { quantity: item.quantity + adjustment }).subscribe({
                next: (updated) => subscriber.next(updated),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete(),
              });
            },
            error: (err) => subscriber.error(err),
          });
        })
    );
  }

  getLowStockItems(): Observable<InventoryItem[]> {
    return this.getAll().pipe(
      map((items) => items.filter((item) => item.quantity <= item.minQuantity))
    );
  }

  search(query: string): Observable<InventoryItem[]> {
    return this.baserow
      .search<BaserowItem>(this.tableId, query)
      .pipe(map((results) => results.map((r) => this.mapFromBaserow(r))));
  }

  getByTag(tag: string): Observable<InventoryItem[]> {
    return this.getAll().pipe(
      map((items) => items.filter((item) => item.tags.includes(tag)))
    );
  }
}
