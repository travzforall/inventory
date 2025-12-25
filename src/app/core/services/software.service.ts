import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import { Software, SoftwareCreate, SoftwareUpdate } from '../models';
import { environment } from '../../../environments/environment';

interface BaserowSoftware {
  id: number;
  setup: boolean;
  done: boolean;
  class: string;
  instance: string;
  description: string;
  https: boolean;
  ip_address: string;
  port: number;
  local: string;
  global: string;
  email: string;
  username: string;
  password: string;
  install_date: string;
  link: string;
  docker_compose_link: string;
  other_useful_components: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SoftwareService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.software;

  private mapFromBaserow(row: BaserowSoftware): Software {
    return {
      id: row.id,
      setup: Boolean(row.setup),
      done: Boolean(row.done),
      class: row.class || '',
      instance: row.instance || '',
      description: row.description || '',
      https: Boolean(row.https),
      ipAddress: row.ip_address || '',
      port: Number(row.port) || 0,
      local: row.local || '',
      global: row.global || '',
      email: row.email || '',
      username: row.username || '',
      password: row.password || '',
      installDate: row.install_date || '',
      link: row.link || '',
      dockerComposeLink: row.docker_compose_link || '',
      otherUsefulComponents: row.other_useful_components || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
    };
  }

  private mapToBaserow(data: SoftwareCreate | SoftwareUpdate): Partial<BaserowSoftware> {
    const mapped: Partial<BaserowSoftware> = {};
    if ('setup' in data && data.setup !== undefined) mapped.setup = data.setup;
    if ('done' in data && data.done !== undefined) mapped.done = data.done;
    if ('class' in data && data.class !== undefined) mapped.class = data.class;
    if ('instance' in data && data.instance !== undefined) mapped.instance = data.instance;
    if ('description' in data && data.description !== undefined) mapped.description = data.description;
    if ('https' in data && data.https !== undefined) mapped.https = data.https;
    if ('ipAddress' in data && data.ipAddress !== undefined) mapped.ip_address = data.ipAddress;
    if ('port' in data && data.port !== undefined) mapped.port = data.port;
    if ('local' in data && data.local !== undefined) mapped.local = data.local;
    if ('global' in data && data.global !== undefined) mapped.global = data.global;
    if ('email' in data && data.email !== undefined) mapped.email = data.email;
    if ('username' in data && data.username !== undefined) mapped.username = data.username;
    if ('password' in data && data.password !== undefined) mapped.password = data.password;
    if ('installDate' in data && data.installDate !== undefined) mapped.install_date = data.installDate;
    if ('link' in data && data.link !== undefined) mapped.link = data.link;
    if ('dockerComposeLink' in data && data.dockerComposeLink !== undefined) mapped.docker_compose_link = data.dockerComposeLink;
    if ('otherUsefulComponents' in data && data.otherUsefulComponents !== undefined) mapped.other_useful_components = data.otherUsefulComponents;
    return mapped;
  }

  getAll(options?: BaserowQueryOptions): Observable<Software[]> {
    return this.baserow
      .getAll<BaserowSoftware>(this.tableId, options)
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<Software> {
    return this.baserow
      .getById<BaserowSoftware>(this.tableId, id)
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  create(data: SoftwareCreate): Observable<Software> {
    return this.baserow
      .create<BaserowSoftware>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  update(id: number, data: SoftwareUpdate): Observable<Software> {
    return this.baserow
      .update<BaserowSoftware>(this.tableId, id, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  delete(id: number): Observable<void> {
    return this.baserow.delete(this.tableId, id);
  }

  search(query: string): Observable<Software[]> {
    return this.baserow
      .search<BaserowSoftware>(this.tableId, query)
      .pipe(map((results) => results.map((r) => this.mapFromBaserow(r))));
  }

  getByClass(className: string): Observable<Software[]> {
    return this.getAll().pipe(
      map((software) => software.filter((s) => s.class === className))
    );
  }

  getPendingSetup(): Observable<Software[]> {
    return this.getAll().pipe(
      map((software) => software.filter((s) => !s.setup || !s.done))
    );
  }

  getCompleted(): Observable<Software[]> {
    return this.getAll().pipe(
      map((software) => software.filter((s) => s.done))
    );
  }
}
