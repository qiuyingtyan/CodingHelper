import type { ProjectContext } from '../utils/projectContext.js';
import { compactHistory, summarizeHistory, loadHistory } from '../repositories/historyRepository.js';
import { getLogStats } from '../repositories/logRepository.js';

export interface CompactResult {
  historyArchived: number;
  historyRemaining: number;
  logsArchived: number;
}

export interface ProjectStats {
  historyTotal: number;
  historyCompleted: number;
  historyRejected: number;
  logFileCount: number;
  logTotalSize: number;
}

export async function getProjectStats(ctx: ProjectContext): Promise<ProjectStats> {
  const history = await loadHistory(ctx);
  const summary = summarizeHistory(history);
  const logStats = await getLogStats(ctx);

  return {
    historyTotal: summary.total,
    historyCompleted: summary.completed,
    historyRejected: summary.rejected,
    logFileCount: logStats.count,
    logTotalSize: logStats.totalSize,
  };
}

export async function compactProject(
  ctx: ProjectContext,
  keepRecent: number,
): Promise<{ archived: number; remaining: number }> {
  return compactHistory(ctx, keepRecent);
}
