import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDir, writeJsonFile } from '../../utils/fs.js';
import { buildProjectContext } from '../../utils/projectContext.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import {
  loadHistory,
  appendHistory,
  compactHistory,
  getTaskHistory,
  summarizeHistory,
} from '../historyRepository.js';
describe('historyRepository', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'hist-repo-'));
    ctx = buildProjectContext(tmpDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('loadHistory returns empty when no file', async () => {
    const history = await loadHistory(ctx);
    expect(history.entries).toEqual([]);
  });

  it('appendHistory adds entry with timestamp', async () => {
    const entry = await appendHistory(ctx, { taskId: 't1', action: 'started' });
    expect(entry.taskId).toBe('t1');
    expect(entry.action).toBe('started');
    expect(entry.timestamp).toBeTruthy();

    const history = await loadHistory(ctx);
    expect(history.entries).toHaveLength(1);
  });

  it('appendHistory accumulates entries', async () => {
    await appendHistory(ctx, { taskId: 't1', action: 'started' });
    await appendHistory(ctx, { taskId: 't1', action: 'completed' });
    await appendHistory(ctx, { taskId: 't2', action: 'started' });

    const history = await loadHistory(ctx);
    expect(history.entries).toHaveLength(3);
  });

  it('compactHistory archives old entries', async () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({
      taskId: `t${i}`,
      action: 'started' as const,
      timestamp: new Date(2025, 0, 1, i).toISOString(),
    }));
    await writeJsonFile(join(ctx.logsDir, 'history.json'), { entries });

    const result = await compactHistory(ctx, 10);
    expect(result.archived).toBe(20);
    expect(result.remaining).toBe(10);

    const history = await loadHistory(ctx);
    expect(history.entries).toHaveLength(10);
  });

  it('compactHistory does nothing when under threshold', async () => {
    const entries = [{ taskId: 't1', action: 'started', timestamp: '2025-01-01T00:00:00Z' }];
    await writeJsonFile(join(ctx.logsDir, 'history.json'), { entries });

    const result = await compactHistory(ctx, 10);
    expect(result.archived).toBe(0);
    expect(result.remaining).toBe(1);
  });

  it('getTaskHistory filters by taskId', () => {
    const history = {
      entries: [
        { taskId: 't1', action: 'started' as const, timestamp: '2025-01-01T00:00:00Z' },
        { taskId: 't2', action: 'started' as const, timestamp: '2025-01-01T01:00:00Z' },
        { taskId: 't1', action: 'completed' as const, timestamp: '2025-01-01T02:00:00Z' },
      ],
    };
    const filtered = getTaskHistory(history, 't1');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(e => e.taskId === 't1')).toBe(true);
  });

  it('summarizeHistory counts actions', () => {
    const history = {
      entries: [
        { taskId: 't1', action: 'started' as const, timestamp: '2025-01-01T00:00:00Z' },
        { taskId: 't1', action: 'completed' as const, timestamp: '2025-01-01T01:00:00Z' },
        { taskId: 't2', action: 'started' as const, timestamp: '2025-01-01T02:00:00Z' },
        { taskId: 't2', action: 'rejected' as const, timestamp: '2025-01-01T03:00:00Z' },
        { taskId: 't3', action: 'resumed' as const, timestamp: '2025-01-01T04:00:00Z' },
      ],
    };
    const summary = summarizeHistory(history);
    expect(summary.total).toBe(5);
    expect(summary.started).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.resumed).toBe(1);
  });
});
