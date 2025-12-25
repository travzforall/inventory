import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaserowService, BaserowQueryOptions } from './baserow.service';
import { Server, ServerCreate, ServerUpdate } from '../models';
import { environment } from '../../../environments/environment';

interface BaserowServer {
  id: number;
  vm_number: number;
  vm_name: string;
  host_name: string;
  cpu: string;
  ram: string;
  hdd: string;
  bucket: string;
  server_os: string;
  ip_address: string;
  dockge: string;
  software_1: string;
  software_1_ports: string;
  software_1_link: string;
  software_2: string;
  software_2_ports: string;
  software_2_link: string;
  software_3: string;
  software_3_ports: string;
  software_3_link: string;
  software_4: string;
  software_4_ports: string;
  software_4_link: string;
  software_5: string;
  software_5_ports: string;
  software_5_link: string;
  vlan: number;
  live: boolean;
  https: boolean;
  setup: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  private baserow = inject(BaserowService);
  private readonly tableId = environment.baserow.tables.servers;

  private mapFromBaserow(row: BaserowServer): Server {
    return {
      id: row.id,
      vmNumber: Number(row.vm_number) || 0,
      vmName: row.vm_name || '',
      hostName: row.host_name || '',
      cpu: row.cpu || '',
      ram: row.ram || '',
      hdd: row.hdd || '',
      bucket: row.bucket || '',
      serverOs: row.server_os || '',
      ipAddress: row.ip_address || '',
      dockge: row.dockge || '',
      software1: row.software_1 || '',
      software1Ports: row.software_1_ports || '',
      software1Link: row.software_1_link || '',
      software2: row.software_2 || '',
      software2Ports: row.software_2_ports || '',
      software2Link: row.software_2_link || '',
      software3: row.software_3 || '',
      software3Ports: row.software_3_ports || '',
      software3Link: row.software_3_link || '',
      software4: row.software_4 || '',
      software4Ports: row.software_4_ports || '',
      software4Link: row.software_4_link || '',
      software5: row.software_5 || '',
      software5Ports: row.software_5_ports || '',
      software5Link: row.software_5_link || '',
      vlan: Number(row.vlan) || 0,
      live: Boolean(row.live),
      https: Boolean(row.https),
      setup: Boolean(row.setup),
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
    };
  }

  private mapToBaserow(data: ServerCreate | ServerUpdate): Partial<BaserowServer> {
    const mapped: Partial<BaserowServer> = {};
    if ('vmNumber' in data && data.vmNumber !== undefined) mapped.vm_number = data.vmNumber;
    if ('vmName' in data && data.vmName !== undefined) mapped.vm_name = data.vmName;
    if ('hostName' in data && data.hostName !== undefined) mapped.host_name = data.hostName;
    if ('cpu' in data && data.cpu !== undefined) mapped.cpu = data.cpu;
    if ('ram' in data && data.ram !== undefined) mapped.ram = data.ram;
    if ('hdd' in data && data.hdd !== undefined) mapped.hdd = data.hdd;
    if ('bucket' in data && data.bucket !== undefined) mapped.bucket = data.bucket;
    if ('serverOs' in data && data.serverOs !== undefined) mapped.server_os = data.serverOs;
    if ('ipAddress' in data && data.ipAddress !== undefined) mapped.ip_address = data.ipAddress;
    if ('dockge' in data && data.dockge !== undefined) mapped.dockge = data.dockge;
    if ('software1' in data && data.software1 !== undefined) mapped.software_1 = data.software1;
    if ('software1Ports' in data && data.software1Ports !== undefined) mapped.software_1_ports = data.software1Ports;
    if ('software1Link' in data && data.software1Link !== undefined) mapped.software_1_link = data.software1Link;
    if ('software2' in data && data.software2 !== undefined) mapped.software_2 = data.software2;
    if ('software2Ports' in data && data.software2Ports !== undefined) mapped.software_2_ports = data.software2Ports;
    if ('software2Link' in data && data.software2Link !== undefined) mapped.software_2_link = data.software2Link;
    if ('software3' in data && data.software3 !== undefined) mapped.software_3 = data.software3;
    if ('software3Ports' in data && data.software3Ports !== undefined) mapped.software_3_ports = data.software3Ports;
    if ('software3Link' in data && data.software3Link !== undefined) mapped.software_3_link = data.software3Link;
    if ('software4' in data && data.software4 !== undefined) mapped.software_4 = data.software4;
    if ('software4Ports' in data && data.software4Ports !== undefined) mapped.software_4_ports = data.software4Ports;
    if ('software4Link' in data && data.software4Link !== undefined) mapped.software_4_link = data.software4Link;
    if ('software5' in data && data.software5 !== undefined) mapped.software_5 = data.software5;
    if ('software5Ports' in data && data.software5Ports !== undefined) mapped.software_5_ports = data.software5Ports;
    if ('software5Link' in data && data.software5Link !== undefined) mapped.software_5_link = data.software5Link;
    if ('vlan' in data && data.vlan !== undefined) mapped.vlan = data.vlan;
    if ('live' in data && data.live !== undefined) mapped.live = data.live;
    if ('https' in data && data.https !== undefined) mapped.https = data.https;
    if ('setup' in data && data.setup !== undefined) mapped.setup = data.setup;
    return mapped;
  }

  getAll(options?: BaserowQueryOptions): Observable<Server[]> {
    return this.baserow
      .getAll<BaserowServer>(this.tableId, options)
      .pipe(map((res) => res.results.map((r) => this.mapFromBaserow(r))));
  }

  getById(id: number): Observable<Server> {
    return this.baserow.getById<BaserowServer>(this.tableId, id).pipe(map((r) => this.mapFromBaserow(r)));
  }

  create(data: ServerCreate): Observable<Server> {
    return this.baserow
      .create<BaserowServer>(this.tableId, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  update(id: number, data: ServerUpdate): Observable<Server> {
    return this.baserow
      .update<BaserowServer>(this.tableId, id, this.mapToBaserow(data))
      .pipe(map((r) => this.mapFromBaserow(r)));
  }

  delete(id: number): Observable<void> {
    return this.baserow.delete(this.tableId, id);
  }

  search(query: string): Observable<Server[]> {
    return this.baserow
      .search<BaserowServer>(this.tableId, query)
      .pipe(map((results) => results.map((r) => this.mapFromBaserow(r))));
  }

  getLiveServers(): Observable<Server[]> {
    return this.getAll().pipe(map((servers) => servers.filter((server) => server.live)));
  }

  getByVlan(vlan: number): Observable<Server[]> {
    return this.getAll().pipe(map((servers) => servers.filter((server) => server.vlan === vlan)));
  }
}
