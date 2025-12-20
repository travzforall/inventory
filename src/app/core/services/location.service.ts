import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin, of, switchMap } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import {
  StorageLocation,
  StorageLocationCreate,
  StorageLocationUpdate,
  LocationWithItems,
  CapacityRule,
} from '../models';
import { environment } from '../../../environments/environment';

interface BaserowLocation {
  id: number;
  name: string;
  description: string;
  parent_location_id: number | null;
  image_gallery: string;
  nfc_tag_id: number | null;
  capacity_rules: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.locations;

  private mapFromBaserow(row: BaserowLocation): StorageLocation {
    let imageGallery: string[] = [];
    let capacityRules: CapacityRule | null = null;

    // Handle both snake_case and user field names
    const imgGallery = row.image_gallery ?? (row as any)['image gallery'] ?? '';
    const capRules = row.capacity_rules ?? (row as any)['capacity rules'] ?? '';
    const parentLocationId = row.parent_location_id ?? (row as any)['parent location id'] ?? null;
    const nfcTagId = row.nfc_tag_id ?? (row as any)['nfc tag id'] ?? null;
    const createdAt = row.created_at ?? (row as any)['created at'] ?? '';
    const updatedAt = row.updated_at ?? (row as any)['updated at'] ?? '';

    try {
      imageGallery = imgGallery ? JSON.parse(imgGallery) : [];
    } catch {
      imageGallery = imgGallery ? [imgGallery] : [];
    }

    try {
      capacityRules = capRules ? JSON.parse(capRules) : null;
    } catch {
      capacityRules = null;
    }

    return {
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      parentLocationId: parentLocationId ? Number(parentLocationId) : null,
      imageGallery,
      nfcTagId: nfcTagId ? Number(nfcTagId) : null,
      capacityRules,
      createdAt,
      updatedAt,
    };
  }

  private mapToBaserow(
    data: StorageLocationCreate | StorageLocationUpdate
  ): Partial<BaserowLocation> {
    const mapped: Partial<BaserowLocation> = {};
    if ('name' in data && data.name !== undefined) mapped.name = data.name;
    if ('description' in data && data.description !== undefined)
      mapped.description = data.description;
    if ('parentLocationId' in data) mapped.parent_location_id = data.parentLocationId ?? null;
    if ('imageGallery' in data && data.imageGallery !== undefined)
      mapped.image_gallery = JSON.stringify(data.imageGallery);
    if ('nfcTagId' in data) mapped.nfc_tag_id = data.nfcTagId ?? null;
    if ('capacityRules' in data)
      mapped.capacity_rules = data.capacityRules ? JSON.stringify(data.capacityRules) : '';
    return mapped;
  }

  getAll(options?: BaserowQueryOptions): Observable<StorageLocation[]> {
    return this.baserow
      .getAll<BaserowLocation>(this.tableId, options)
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<StorageLocation> {
    return this.baserow
      .getById<BaserowLocation>(this.tableId, id)
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  getByNfcTagId(tagId: number): Observable<StorageLocation | undefined> {
    return this.baserow
      .getAll<BaserowLocation>(this.tableId, {
        filters: [{ field: 'nfc_tag_id', type: 'equal', value: tagId }],
        size: 1,
      })
      .pipe(
        map((res) => res.results[0]),
        map((r) => (r ? this.mapFromBaserow(r) : undefined))
      );
  }

  create(data: StorageLocationCreate): Observable<StorageLocation> {
    return this.baserow
      .create<BaserowLocation>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  update(id: number, data: StorageLocationUpdate): Observable<StorageLocation> {
    return this.baserow
      .update<BaserowLocation>(this.tableId, id, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  delete(id: number): Observable<void> {
    return this.baserow.delete(this.tableId, id);
  }

  getChildren(parentId: number): Observable<StorageLocation[]> {
    // Filter client-side since user_field_names changes filter syntax
    return this.getAll().pipe(
      map((locations) => locations.filter((loc) => loc.parentLocationId === parentId))
    );
  }

  getRootLocations(): Observable<StorageLocation[]> {
    // Filter client-side for locations with no parent
    return this.getAll().pipe(
      map((locations) => locations.filter((loc) => !loc.parentLocationId))
    );
  }

  search(query: string): Observable<StorageLocation[]> {
    return this.baserow
      .search<BaserowLocation>(this.tableId, query)
      .pipe(map((results) => results.map((r) => this.mapFromBaserow(r))));
  }

  getLocationPath(location: StorageLocation): Observable<StorageLocation[]> {
    if (!location.parentLocationId) {
      return of([location]);
    }

    return this.getById(location.parentLocationId).pipe(
      switchMap((parent) =>
        this.getLocationPath(parent).pipe(map((path) => [...path, location]))
      )
    );
  }
}
