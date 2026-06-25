import Dexie, { type Table } from 'dexie';
import type { ProofOfDelivery, TripPing } from './types';

interface LocalShipment {
  id: string;
  data: Record<string, unknown>;
  synced: 0 | 1;
  created_at: string;
}

export interface SyncQueueItem {
  id?: number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE';
  payload: Record<string, unknown>;
  synced: 0 | 1;
  created_at: string;
}

class EHILocalDB extends Dexie {
  shipments!: Table<LocalShipment>;
  manifests!: Table<LocalShipment>;
  marketing_entries!: Table<LocalShipment>;
  cargo_entries!: Table<LocalShipment>;
  proof_of_delivery!: Table<ProofOfDelivery>;
  trip_pings!: Table<TripPing>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super('EHILocalDB');
    this.version(1).stores({
      shipments: 'id, synced, created_at',
      manifests: 'id, synced, created_at',
      marketing_entries: 'id, synced, created_at',
      air_consignments: 'id, synced, created_at',
      sync_queue: '++id, table_name, synced, created_at',
    });
    this.version(2).stores({
      shipments: 'id, synced, created_at',
      manifests: 'id, synced, created_at',
      marketing_entries: 'id, synced, created_at',
      air_consignments: null,
      cargo_entries: 'id, synced, created_at',
      sync_queue: '++id, table_name, synced, created_at',
    });
    this.version(3).stores({
      cargo_entries: 'id, synced, created_at',
      manifests: 'id, synced, created_at',
      marketing_entries: 'id, synced, created_at',
      proof_of_delivery: 'id, awbNumber, synced, deliveredAt',
      sync_queue: '++id, table_name, synced, created_at',
    });
    this.version(4).stores({
      cargo_entries: 'id, synced, created_at',
      manifests: 'id, synced, created_at',
      marketing_entries: 'id, synced, created_at',
      proof_of_delivery: 'id, awbNumber, synced, deliveredAt',
      trip_pings: '++id, tripId, timestamp, synced',
      sync_queue: '++id, table_name, synced, created_at',
    });
    this.version(5).stores({
      cargo_entries: 'id, synced, created_at',
      manifests: 'id, synced, created_at',
      marketing_entries: 'id, synced, created_at',
      proof_of_delivery: 'id, awbNumber, synced, deliveredAt',
      trip_pings: '++id, tripId, timestamp, synced',
      sync_queue: '++id, table_name, record_id, synced, created_at',
    });
  }
}

export const db = new EHILocalDB();
