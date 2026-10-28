import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { type Backup, backupFileName, buildBackup, parseBackup, type ParseResult } from './backup';

/**
 * The file side of backups: write + share sheet for export, the document picker for import, and
 * the automatic copy kept in the app's documents before every import.
 */
export async function exportBackup(dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.write(JSON.stringify(buildBackup()));
  // A cancelled share sheet resolves normally: nothing happens.
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle,
    UTI: 'public.json',
  });
}

/** Kept, never deleted: the state just before an import replaced it. */
export function saveAutoBackup(now = Date.now()): string {
  const file = new File(Paths.document, `untangle-auto-${now}.json`);
  file.write(JSON.stringify(buildBackup(now)));
  return file.uri;
}

export type PickResult = ParseResult | { ok: false; reason: 'cancelled' };

export async function pickBackup(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, reason: 'cancelled' };
  try {
    return parseBackup(await new File(result.assets[0].uri).text());
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export type { Backup };
