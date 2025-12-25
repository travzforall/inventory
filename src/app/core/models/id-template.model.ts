export interface IdOption {
  code: string; // "W" for Wood, "P" for Phillips
  label: string; // "Wood", "Phillips"
  description?: string; // Optional description
}

export interface IdSegment {
  name: string; // "Material", "Head Type", "Length"
  position: number; // Order in the ID (0-indexed)
  type: 'select' | 'number' | 'text';
  options?: IdOption[]; // For 'select' type
  suffix?: string; // e.g., "mm" for length
  prefix?: string; // Optional prefix before the value
}

export interface IdTemplate {
  id: number;
  name: string; // "Screws", "Audio Cables", "HDMI Cables"
  category: string; // Links to item category
  segments: IdSegment[]; // Ordered list of segments
  createdAt: string;
  updatedAt: string;
}

export interface IdTemplateCreate {
  name: string;
  category: string;
  segments: IdSegment[];
}

export interface IdTemplateUpdate {
  name?: string;
  category?: string;
  segments?: IdSegment[];
}

// Segment value used when generating an ID
export interface SegmentValue {
  segmentName: string;
  value: string; // The code/number/text entered
}

// Pending item in bulk add list
export interface PendingBulkItem {
  id: string; // Temporary ID for tracking in UI
  generatedSku: string;
  name: string;
  quantity: number;
  templateId: number;
  segmentValues: SegmentValue[];
}
