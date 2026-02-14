import { resolveProjectContext } from '../utils/projectContext.js';
import { compactHistory } from '../core/historyManager.js';
import { printSuccess, printInfo, printPhaseHeader } from '../utils/display.js';
import { join } from 'node:path';
import { readdir, stat, rename } from 'node:fs/promises';
import { ensureDir, fileExists } from '../utils/fs.js';

export interface CompactOptions {
  keep?: string;
  days?: string;
}

export async function runCompact(opts?: CompactOptions): Promise<void> {
  printPhaseHeader('compact', '压缩历史与日志');

  const ctx = await resolveProjectContext();
  const keepRecent = opts?.keep ? Number(opts.keep) : 50;
  const maxDays = opts?.days ? Number(opts.days) : 30;

  // 1. Compact history
  printInfo('正在压缩历史记录...');
  const { archived, remaining } = await compactHistory(ctx, keepRecent);
  if (archived > 0) {
    printSuccess(`已归档 ${archived} 条历史记录，保留最近 ${remaining} 条。`);
  } else {
    printInfo(`历史记录共 ${remaining} 条，无需压缩。`);
  }

  // 2. Archive old log files
  printInfo('正在检查过期日志文件...');
  const archivedLogs = await archiveOldLogs(ctx.logsDir, maxDays);
  if (archivedLogs > 0) {
    printSuccess(`已归档 ${archivedLogs} 个过期日志文件。`);
  } else {
    printInfo('没有过期的日志文件。');
  }

  printSuccess('压缩完成。');
}

async function archiveOldLogs(logsDir: string, maxDays: number): Promise<number> {
  if (!(await fileExists(logsDir))) return 0;

  const archiveDir = join(logsDir, 'archive');
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const files = await readdir(logsDir);
  let count = 0;

  for (const file of files) {
    if (file === 'archive' || file === 'history.json') continue;
    const filePath = join(logsDir, file);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) continue;

    if (fileStat.mtimeMs < cutoff) {
      await ensureDir(archiveDir);
      await rename(filePath, join(archiveDir, file));
      count++;
    }
  }

  return count;
}
