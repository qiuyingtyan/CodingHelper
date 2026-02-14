import { readJsonFile, writeJsonFile, fileExists } from '../utils/fs.js';
import { join } from 'node:path';
import { z } from 'zod';
import type { ProjectContext } from '../utils/projectContext.js';

const HistoryEntrySchema = z.object({
  taskId: z.string(),
  action: z.enum(['started', 'completed', 'rejected', 'resumed']),
  timestamp: z.string(),
  note: z.string().optional(),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

const HistorySchema = z.object({
  entries: z.array(HistoryEntrySchema),
});
export type History = z.infer<typeof HistorySchema>;

const AUTO_COMPACT_THRESHOLD = 100;
const DEFAULT_KEEP_RECENT = 50;

function historyPath(ctx: ProjectContext): string {
  return join(ctx.logsDir, 'history.json');
}

function archivePath(ctx: ProjectContext): string {
  const date = new Date().toISOString().slice(0, 10);
  return join(ctx.logsDir, `history-archive-${date}.json`);
}

export async function loadHistory(ctx: ProjectContext): Promise<History> {
  const p = historyPath(ctx);
  if (!(await fileExists(p))) {
    return { entries: [] };
  }
  return readJsonFile(p, HistorySchema);
}

export async function appendHistory(
  ctx: ProjectContext,
  entry: Omit<HistoryEntry, 'timestamp'>,
): Promise<HistoryEntry> {
  const history = await loadHistory(ctx);
  const full: HistoryEntry = { ...entry, timestamp: new Date().toISOString() };
  const updated = { entries: [...history.entries, full] };

  if (updated.entries.length > AUTO_COMPACT_THRESHOLD) {
    await compactHistory(ctx, DEFAULT_KEEP_RECENT, updated);
  } else {
    await writeJsonFile(historyPath(ctx), updated);
  }

  return full;
}

export async function compactHistory(
  ctx: ProjectContext,
  keepRecent = DEFAULT_KEEP_RECENT,
  historyOverride?: History,
): Promise<{ archived: number; remaining: number }> {
  const history = historyOverride ?? await loadHistory(ctx);

  if (history.entries.length <= keepRecent) {
    return { archived: 0, remaining: history.entries.length };
  }

  const cutIndex = history.entries.length - keepRecent;
  const toArchive = history.entries.slice(0, cutIndex);
  const toKeep = history.entries.slice(cutIndex);

  // Append to archive file (merge if exists)
  const archPath = archivePath(ctx);
  let existing: History = { entries: [] };
  if (await fileExists(archPath)) {
    existing = await readJsonFile(archPath, HistorySchema);
  }
  await writeJsonFile(archPath, { entries: [...existing.entries, ...toArchive] });

  // Write compacted history
  await writeJsonFile(historyPath(ctx), { entries: toKeep });

  return { archived: toArchive.length, remaining: toKeep.length };
}

export function getTaskHistory(history: History, taskId: string): HistoryEntry[] {
  return history.entries.filter((e) => e.taskId === taskId);
}

export function summarizeHistory(history: History): {
  total: number;
  started: number;
  completed: number;
  rejected: number;
  resumed: number;
} {
  const counts = { total: history.entries.length, started: 0, completed: 0, rejected: 0, resumed: 0 };
  for (const e of history.entries) {
    if (e.action in counts) {
      counts[e.action as keyof Omit<typeof counts, 'total'>]++;
    }
  }
  return counts;
}
