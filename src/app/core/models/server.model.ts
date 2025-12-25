export interface SoftwareEntry {
  name: string;
  port: string;
  link: string;
}

export interface Server {
  id: number;
  vmNumber: number;
  vmName: string;
  hostName: string;
  cpu: string;
  ram: string;
  hdd: string;
  bucket: string;
  serverOs: string;
  ipAddress: string;
  dockge: string; // Dockge port number as string
  software1: string;
  software1Ports: string;
  software1Link: string;
  software2: string;
  software2Ports: string;
  software2Link: string;
  software3: string;
  software3Ports: string;
  software3Link: string;
  software4: string;
  software4Ports: string;
  software4Link: string;
  software5: string;
  software5Ports: string;
  software5Link: string;
  vlan: number;
  live: boolean;
  https: boolean;
  setup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCreate {
  vmNumber: number;
  vmName: string;
  hostName?: string;
  cpu?: string;
  ram?: string;
  hdd?: string;
  bucket?: string;
  serverOs?: string;
  ipAddress?: string;
  dockge?: string;
  software1?: string;
  software1Ports?: string;
  software1Link?: string;
  software2?: string;
  software2Ports?: string;
  software2Link?: string;
  software3?: string;
  software3Ports?: string;
  software3Link?: string;
  software4?: string;
  software4Ports?: string;
  software4Link?: string;
  software5?: string;
  software5Ports?: string;
  software5Link?: string;
  vlan?: number;
  live?: boolean;
  https?: boolean;
  setup?: boolean;
}

export interface ServerUpdate {
  vmNumber?: number;
  vmName?: string;
  hostName?: string;
  cpu?: string;
  ram?: string;
  hdd?: string;
  bucket?: string;
  serverOs?: string;
  ipAddress?: string;
  dockge?: string;
  software1?: string;
  software1Ports?: string;
  software1Link?: string;
  software2?: string;
  software2Ports?: string;
  software2Link?: string;
  software3?: string;
  software3Ports?: string;
  software3Link?: string;
  software4?: string;
  software4Ports?: string;
  software4Link?: string;
  software5?: string;
  software5Ports?: string;
  software5Link?: string;
  vlan?: number;
  live?: boolean;
  https?: boolean;
  setup?: boolean;
}
