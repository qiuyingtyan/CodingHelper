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

function historyPath(ctx: ProjectContext): string {
  return join(ctx.logsDir, 'history.json');
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
  history.entries.push(full);
  await writeJsonFile(historyPath(ctx), history);
  return full;
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
