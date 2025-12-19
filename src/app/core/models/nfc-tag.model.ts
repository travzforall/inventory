export type TagType = 'location' | 'item' | 'action';
export type TagStatus = 'active' | 'disabled' | 'lost';

export interface NfcTag {
  id: number;
  tagUid: string;
  tagType: TagType;
  linkedEntityId: number | null;
  status: TagStatus;
  createdAt: string;
}

export interface NfcTagCreate {
  tagUid: string;
  tagType: TagType;
  linkedEntityId?: number;
  status?: TagStatus;
}

export interface NfcTagUpdate {
  tagUid?: string;
  tagType?: TagType;
  linkedEntityId?: number | null;
  status?: TagStatus;
}
