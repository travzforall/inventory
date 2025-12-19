import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import { ScanEvent, ScanEventCreate, ActionTaken } from '../models';
import { environment } from '../../../environments/environment';

interface BaserowScanEvent {
  id: number;
  tag_id: number;
  user_id: number | null;
  timestamp: string;
  device_type: string;
  action_taken: string | null;
  metadata: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScanEventService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.scanEvents;

  private mapFromBaserow(row: BaserowScanEvent): ScanEvent {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = row.metadata ? JSON.parse(row.metadata) : {};
    } catch {
      metadata = {};
    }

    return {
      id: row.id,
      tagId: row.tag_id,
      userId: row.user_id,
      timestamp: row.timestamp,
      deviceType: row.device_type,
      actionTaken: row.action_taken as ActionTaken | null,
      metadata,
    };
  }

  private mapToBaserow(data: ScanEventCreate): Partial<BaserowScanEvent> {
    return {
      tag_id: data.tagId,
      user_id: data.userId ?? null,
      device_type: data.deviceType,
      action_taken: data.actionTaken ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
      timestamp: new Date().toISOString(),
    };
  }

  getAll(options?: BaserowQueryOptions): Observable<ScanEvent[]> {
    return this.baserow
      .getAll<BaserowScanEvent>(this.tableId, {
        ...options,
        orderBy: '-timestamp',
      })
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<ScanEvent> {
    return this.baserow
      .getById<BaserowScanEvent>(this.tableId, id)
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  getByTagId(tagId: number, options?: BaserowQueryOptions): Observable<ScanEvent[]> {
    return this.baserow
      .getAll<BaserowScanEvent>(this.tableId, {
        ...options,
        filters: [{ field: 'tag_id', type: 'equal', value: tagId }],
        orderBy: '-timestamp',
      })
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getByUserId(userId: number, options?: BaserowQueryOptions): Observable<ScanEvent[]> {
    return this.baserow
      .getAll<BaserowScanEvent>(this.tableId, {
        ...options,
        filters: [{ field: 'user_id', type: 'equal', value: userId }],
        orderBy: '-timestamp',
      })
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  create(data: ScanEventCreate): Observable<ScanEvent> {
    return this.baserow
      .create<BaserowScanEvent>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  logScan(
    tagId: number,
    deviceType: string,
    userId?: number,
    actionTaken?: ActionTaken,
    metadata?: Record<string, unknown>
  ): Observable<ScanEvent> {
    return this.create({
      tagId,
      deviceType,
      userId,
      actionTaken,
      metadata,
    });
  }

  getRecentScans(limit: number = 50): Observable<ScanEvent[]> {
    return this.getAll({ size: limit });
  }

  getScansByDateRange(startDate: Date, endDate: Date): Observable<ScanEvent[]> {
    return this.getAll().pipe(
      map((events) =>
        events.filter((e) => {
          const ts = new Date(e.timestamp);
          return ts >= startDate && ts <= endDate;
        })
      )
    );
  }

  getScanCountByLocation(locationTagId: number): Observable<number> {
    return this.getByTagId(locationTagId).pipe(map((events) => events.length));
  }
}
