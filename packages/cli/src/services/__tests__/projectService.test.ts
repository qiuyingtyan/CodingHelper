import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDir, writeJsonFile } from '../../utils/fs.js';
import { buildProjectContext } from '../../utils/projectContext.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import { getProjectStats, compactProject } from '../projectService.js';

describe('projectService', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'proj-svc-'));
    ctx = buildProjectContext(tmpDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('getProjectStats returns zeros for empty project', async () => {
    await writeJsonFile(join(ctx.logsDir, 'history.json'), { entries: [] });
    const stats = await getProjectStats(ctx);
    expect(stats.historyTotal).toBe(0);
    expect(stats.historyCompleted).toBe(0);
    expect(stats.historyRejected).toBe(0);
    expect(stats.logFileCount).toBe(0);
    expect(stats.logTotalSize).toBe(0);
  });

  it('getProjectStats counts history entries and log files', async () => {
    await writeJsonFile(join(ctx.logsDir, 'history.json'), {
      entries: [
        { taskId: 't1', action: 'started', timestamp: '2025-01-01T00:00:00Z' },
        { taskId: 't1', action: 'completed', timestamp: '2025-01-01T01:00:00Z' },
        { taskId: 't2', action: 'started', timestamp: '2025-01-01T02:00:00Z' },
        { taskId: 't2', action: 'rejected', timestamp: '2025-01-01T03:00:00Z' },
      ],
    });
    await writeFile(join(ctx.logsDir, 'debug-123.json'), '{}', 'utf-8');
    await writeFile(join(ctx.logsDir, 'review-456.json'), '{}', 'utf-8');

    const stats = await getProjectStats(ctx);
    expect(stats.historyTotal).toBe(4);
    expect(stats.historyCompleted).toBe(1);
    expect(stats.historyRejected).toBe(1);
    expect(stats.logFileCount).toBe(2);
    expect(stats.logTotalSize).toBeGreaterThan(0);
  });

  it('compactProject delegates to compactHistory', async () => {
    const entries = Array.from({ length: 80 }, (_, i) => ({
      taskId: `t${i}`,
      action: 'started' as const,
      timestamp: new Date(2025, 0, 1, i).toISOString(),
    }));
    await writeJsonFile(join(ctx.logsDir, 'history.json'), { entries });

    const result = await compactProject(ctx, 20);
    expect(result.archived).toBe(60);
    expect(result.remaining).toBe(20);
  });
});
