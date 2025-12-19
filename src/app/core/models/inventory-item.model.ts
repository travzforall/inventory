export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  images: string[]; // URLs or file IDs
  currentLocationId: number | null;
  tags: string[]; // categories, attributes, flags
  description: string;
  minQuantity: number; // For low-stock alerts
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemCreate {
  name: string;
  sku: string;
  quantity?: number;
  images?: string[];
  currentLocationId?: number;
  tags?: string[];
  description?: string;
  minQuantity?: number;
}

export interface InventoryItemUpdate {
  name?: string;
  sku?: string;
  quantity?: number;
  images?: string[];
  currentLocationId?: number | null;
  tags?: string[];
  description?: string;
  minQuantity?: number;
}

export interface ItemWithLocation extends InventoryItem {
  location: {
    id: number;
    name: string;
    path: string; // Full hierarchy path
  } | null;
}
