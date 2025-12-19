export interface StorageLocation {
  id: number;
  name: string;
  description: string;
  parentLocationId: number | null;
  imageGallery: string[]; // URLs or file IDs
  nfcTagId: number | null;
  capacityRules: CapacityRule | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityRule {
  maxItems?: number;
  maxWeight?: number;
  weightUnit?: 'kg' | 'lb';
  allowedCategories?: string[];
}

export interface StorageLocationCreate {
  name: string;
  description?: string;
  parentLocationId?: number;
  imageGallery?: string[];
  nfcTagId?: number;
  capacityRules?: CapacityRule;
}

export interface StorageLocationUpdate {
  name?: string;
  description?: string;
  parentLocationId?: number | null;
  imageGallery?: string[];
  nfcTagId?: number | null;
  capacityRules?: CapacityRule | null;
}

export interface LocationWithItems extends StorageLocation {
  items: InventoryItemSummary[];
  childLocations: StorageLocation[];
}

export interface InventoryItemSummary {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  thumbnailUrl: string | null;
}
