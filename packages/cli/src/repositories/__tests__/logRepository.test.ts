import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDir } from '../../utils/fs.js';
import { buildProjectContext } from '../../utils/projectContext.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import { listLogFiles, readLogFile, getLogStats } from '../logRepository.js';

describe('logRepository', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'log-repo-'));
    ctx = buildProjectContext(tmpDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('listLogFiles returns empty array when no logs', async () => {
    const files = await listLogFiles(ctx);
    expect(files).toEqual([]);
  });

  it('listLogFiles excludes history.json', async () => {
    await writeFile(join(ctx.logsDir, 'history.json'), '{}', 'utf-8');
    await writeFile(join(ctx.logsDir, 'debug-1.json'), '{}', 'utf-8');
    await writeFile(join(ctx.logsDir, 'review-2.json'), '{}', 'utf-8');

    const files = await listLogFiles(ctx);
    expect(files).toEqual(['debug-1.json', 'review-2.json']);
    expect(files).not.toContain('history.json');
  });

  it('listLogFiles returns empty when logsDir does not exist', async () => {
    await rm(ctx.logsDir, { recursive: true, force: true });
    const files = await listLogFiles(ctx);
    expect(files).toEqual([]);
  });

  it('readLogFile reads file content', async () => {
    await writeFile(join(ctx.logsDir, 'test.json'), '{"key":"value"}', 'utf-8');
    const content = await readLogFile(ctx, 'test.json');
    expect(content).toBe('{"key":"value"}');
  });

  it('getLogStats returns count and total size', async () => {
    await writeFile(join(ctx.logsDir, 'a.json'), 'hello', 'utf-8');
    await writeFile(join(ctx.logsDir, 'b.json'), 'world!', 'utf-8');
    await writeFile(join(ctx.logsDir, 'history.json'), 'skip', 'utf-8');

    const stats = await getLogStats(ctx);
    expect(stats.count).toBe(2);
    expect(stats.totalSize).toBe(11); // 5 + 6
  });
});
