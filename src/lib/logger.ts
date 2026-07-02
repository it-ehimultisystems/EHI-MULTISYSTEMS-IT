import * as Sentry from '@sentry/react';

export type LogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'FATAL';

export interface AppLogMessage {
  id: string;
  time: string;
  level: LogLevel;
  source: string;
  text: string;
}

class Logger {
  private logs: AppLogMessage[] = [];
  private listeners: Set<(logs: AppLogMessage[]) => void> = new Set();

  log(level: LogLevel, source: string, text: string) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: AppLogMessage = {
      id: Math.random().toString(36).substring(2, 11),
      time: timeStr,
      level,
      source,
      text
    };

    this.logs = [newLog, ...this.logs].slice(0, 100);
    this.notify();

    // This 100-entry buffer is per-tab and vanishes on refresh — it's a
    // handy live view for whoever is looking at that device right now,
    // but it was previously the ONLY record of errors anywhere. Mirror
    // ERROR/FATAL to Sentry so a problem at a remote hub is actually
    // visible without someone happening to have the IT Debug tab open.
    if (level === 'ERROR' || level === 'FATAL') {
      Sentry.captureMessage(`[${source}] ${text}`, level === 'FATAL' ? 'fatal' : 'error');
    }
  }

  getLogs() {
    return this.logs;
  }

  subscribe(listener: (logs: AppLogMessage[]) => void) {
    this.listeners.add(listener);
    listener(this.logs);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.logs));
  }
}

export const appLogger = new Logger();

// Initial boot logs
appLogger.log('INFO', 'SYS_CORE', 'EHI Multi-Systems Logistics Daemon booted successfully');
appLogger.log('DEBUG', 'DEXIE_DB', 'Connected to local IndexedDB [EHILocalDB]');
appLogger.log('INFO', 'SYNC', 'Offline sync scheduler initialized.');
appLogger.log('INFO', 'CONN', 'Supabase connection initialized');
