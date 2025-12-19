import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import { NfcTag, NfcTagCreate, NfcTagUpdate, TagType } from '../models';
import { environment } from '../../../environments/environment';

interface BaserowNfcTag {
  id: number;
  tag_uid: string;
  tag_type: string;
  linked_entity_id: number | null;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class NfcTagService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.nfcTags;

  private mapFromBaserow(row: BaserowNfcTag): NfcTag {
    return {
      id: row.id,
      tagUid: row.tag_uid,
      tagType: row.tag_type as TagType,
      linkedEntityId: row.linked_entity_id,
      status: row.status as NfcTag['status'],
      createdAt: row.created_at,
    };
  }

  private mapToBaserow(data: NfcTagCreate | NfcTagUpdate): Partial<BaserowNfcTag> {
    const mapped: Partial<BaserowNfcTag> = {};
    if ('tagUid' in data && data.tagUid !== undefined) mapped.tag_uid = data.tagUid;
    if ('tagType' in data && data.tagType !== undefined) mapped.tag_type = data.tagType;
    if ('linkedEntityId' in data) mapped.linked_entity_id = data.linkedEntityId ?? null;
    if ('status' in data && data.status !== undefined) mapped.status = data.status;
    return mapped;
  }

  getAll(options?: BaserowQueryOptions): Observable<NfcTag[]> {
    return this.baserow
      .getAll<BaserowNfcTag>(this.tableId, options)
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<NfcTag> {
    return this.baserow
      .getById<BaserowNfcTag>(this.tableId, id)
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  getByUid(tagUid: string): Observable<NfcTag | undefined> {
    return this.baserow.getAll<BaserowNfcTag>(this.tableId, {
      filters: [{ field: 'tag_uid', type: 'equal', value: tagUid }],
      size: 1,
    }).pipe(
      map((res) => res.results[0]),
      map((r) => (r ? this.mapFromBaserow(r) : undefined))
    );
  }

  create(data: NfcTagCreate): Observable<NfcTag> {
    return this.baserow
      .create<BaserowNfcTag>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  update(id: number, data: NfcTagUpdate): Observable<NfcTag> {
    return this.baserow
      .update<BaserowNfcTag>(this.tableId, id, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  delete(id: number): Observable<void> {
    return this.baserow.delete(this.tableId, id);
  }

  getActiveByType(type: TagType): Observable<NfcTag[]> {
    return this.baserow
      .getAll<BaserowNfcTag>(this.tableId, {
        filters: [
          { field: 'tag_type', type: 'equal', value: type },
          { field: 'status', type: 'equal', value: 'active' },
        ],
      })
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }
}
