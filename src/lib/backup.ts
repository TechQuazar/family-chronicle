// JSON backup / restore for the local (localStorage) backend.
//
// Buds stores the whole chronicle in the browser under the `buds_` prefix
// (see src/adapters/local/storage.ts). Clearing site data deletes it with
// no other copy anywhere, so this module exports everything that matters
// to a single downloadable JSON file and imports it back.
//
// Deliberately NOT exported:
// - `users`    — contains passwordHash values (demo-grade hashes); a backup
//                of the family data must never double as a credential leak.
// - `session`  — a live auth token; restoring it makes no sense.
// Families keep their `createdById`, so after importing on a fresh browser
// the user signs in with the same account and their trees reappear.

import { getFromStorage, setToStorage } from '@/adapters/local/storage';
import type { Bud, BudConnection, DiaryEntry, Family, MessageToFuture } from '@/types/models';

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'buds-family-chronicle';

export interface BudsBackupData {
  families: Family[];
  buds: Bud[];
  connections: BudConnection[];
  messages: MessageToFuture[];
  diary_entries: DiaryEntry[];
}

export interface BudsBackup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: BudsBackupData;
}

// Storage keys, matching the constants in src/adapters/local/*.ts
const DATA_KEYS = ['families', 'buds', 'connections', 'messages', 'diary_entries'] as const;

export function buildBackup(): BudsBackup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      families: getFromStorage<Family[]>('families') || [],
      buds: getFromStorage<Bud[]>('buds') || [],
      connections: getFromStorage<BudConnection[]>('connections') || [],
      messages: getFromStorage<MessageToFuture[]>('messages') || [],
      diary_entries: getFromStorage<DiaryEntry[]>('diary_entries') || [],
    },
  };
}

export function backupFilename(now = new Date()): string {
  return `buds-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFilename();
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse and validate backup file text. Throws Error with a user-facing message. */
export function parseBackup(text: string): BudsBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('That file is not a Buds backup.');
  }
  const backup = parsed as Partial<BudsBackup>;
  if (backup.app !== BACKUP_APP) {
    throw new Error('That file is not a Buds backup.');
  }
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(backup.version)}`);
  }
  if (typeof backup.data !== 'object' || backup.data === null) {
    throw new Error('Backup is missing its data section.');
  }
  for (const key of DATA_KEYS) {
    if (!Array.isArray((backup.data as unknown as Record<string, unknown>)[key])) {
      throw new Error(`Backup is missing the "${key}" list.`);
    }
  }
  return backup as BudsBackup;
}

/** Overwrite the local chronicle with the backup's contents. */
export function importBackup(backup: BudsBackup): void {
  for (const key of DATA_KEYS) {
    setToStorage(key, backup.data[key]);
  }
}

export function backupCounts(backup: BudsBackup): string {
  const d = backup.data;
  return `${d.families.length} families, ${d.buds.length} buds, ${d.connections.length} connections, ${d.messages.length} messages, ${d.diary_entries.length} diary entries`;
}
