export type ActionTaken =
  | 'view_location'
  | 'view_item'
  | 'add_item'
  | 'remove_item'
  | 'adjust_quantity'
  | 'start_audit'
  | 'flag_discrepancy'
  | 'transfer_item';

export interface ScanEvent {
  id: number;
  tagId: number;
  userId: number | null;
  timestamp: string;
  deviceType: string;
  actionTaken: ActionTaken | null;
  metadata: Record<string, unknown>;
}

export interface ScanEventCreate {
  tagId: number;
  userId?: number;
  deviceType: string;
  actionTaken?: ActionTaken;
  metadata?: Record<string, unknown>;
}

export interface ScanEventWithDetails extends ScanEvent {
  tag: {
    tagUid: string;
    tagType: string;
  };
  user: {
    name: string;
    email: string;
  } | null;
}
