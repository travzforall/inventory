export interface Software {
  id: number;
  setup: boolean;
  done: boolean;
  class: string; // e.g., 'Database', 'Web Server', 'Monitoring'
  instance: string;
  description: string;
  https: boolean;
  ipAddress: string;
  port: number;
  local: string; // Local URL/path
  global: string; // Global/external URL
  email: string;
  username: string;
  password: string; // Note: In production, this should be encrypted
  installDate: string;
  link: string;
  dockerComposeLink: string;
  otherUsefulComponents: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareCreate {
  setup?: boolean;
  done?: boolean;
  class: string;
  instance: string;
  description?: string;
  https?: boolean;
  ipAddress?: string;
  port?: number;
  local?: string;
  global?: string;
  email?: string;
  username?: string;
  password?: string;
  installDate?: string;
  link?: string;
  dockerComposeLink?: string;
  otherUsefulComponents?: string;
}

export interface SoftwareUpdate {
  setup?: boolean;
  done?: boolean;
  class?: string;
  instance?: string;
  description?: string;
  https?: boolean;
  ipAddress?: string;
  port?: number;
  local?: string;
  global?: string;
  email?: string;
  username?: string;
  password?: string;
  installDate?: string;
  link?: string;
  dockerComposeLink?: string;
  otherUsefulComponents?: string;
}
