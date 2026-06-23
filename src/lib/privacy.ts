import { db } from './db';

export async function cleanupOldPings(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
    await (db as any).trip_pings.where('timestamp').below(cutoff).delete();
  } catch (err) {
    console.warn('Failed to cleanup old pings:', err);
  }
}
