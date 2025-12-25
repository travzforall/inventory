export interface LabelQueueItem {
  id: string; // UUID for queue item
  cid: string; // The CID to print
  name: string; // Item name
  quantity: number; // How many labels to print
  addedAt: string; // ISO date string
  printed: boolean;
}

export interface CidRegistryEntry {
  cid: string;
  itemId?: number; // Baserow item ID if created
  name: string;
  createdAt: string;
}
