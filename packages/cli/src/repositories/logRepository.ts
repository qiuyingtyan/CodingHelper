import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { readTextFile, fileExists } from '../utils/fs.js';
import type { ProjectContext } from '../utils/projectContext.js';

export async function listLogFiles(ctx: ProjectContext): Promise<string[]> {
  if (!(await fileExists(ctx.logsDir))) return [];
  const files = await readdir(ctx.logsDir);
  return files.filter(f => f.endsWith('.json') && f !== 'history.json').sort();
}

export async function readLogFile(ctx: ProjectContext, filename: string): Promise<string> {
  return readTextFile(join(ctx.logsDir, filename));
}

export async function getLogStats(ctx: ProjectContext): Promise<{ count: number; totalSize: number }> {
  const files = await listLogFiles(ctx);
  let totalSize = 0;
  for (const f of files) {
    const s = await stat(join(ctx.logsDir, f));
    totalSize += s.size;
  }
  return { count: files.length, totalSize };
}
