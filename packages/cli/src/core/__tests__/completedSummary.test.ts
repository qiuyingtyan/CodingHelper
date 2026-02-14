import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { injectCompletedSummary } from '../claudeMdManager.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import type { TaskItem } from '../../types/index.js';

function makeCtx(rootDir: string): ProjectContext {
  return {
    rootDir,
    helperDir: join(rootDir, '.codinghelper'),
    configPath: join(rootDir, '.codinghelper', 'config.json'),
    requirementsPath: join(rootDir, '.codinghelper', 'requirements.md'),
    specPath: join(rootDir, '.codinghelper', 'spec.md'),
    tasksDir: join(rootDir, '.codinghelper', 'tasks'),
    taskIndexPath: join(rootDir, '.codinghelper', 'tasks', 'index.json'),
    claudeMdPath: join(rootDir, 'CLAUDE.md'),
    logsDir: join(rootDir, '.codinghelper', 'logs'),
  };
}

const completedTask: TaskItem = {
  id: 'task-001',
  title: '用户登录',
  status: 'completed',
  dependencies: [],
  priority: 1,
  createdAt: '2025-01-01T00:00:00Z',
  completedAt: '2025-01-02T00:00:00Z',
};

describe('claudeMdManager - injectCompletedSummary', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'claude-md-summary-'));
    ctx = makeCtx(tmpDir);
    await writeFile(ctx.claudeMdPath, '# CLAUDE.md\n\n基础内容\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates completed summary section', async () => {
    await injectCompletedSummary(ctx, completedTask);
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).toContain('<!-- COMPLETED_SUMMARY_START -->');
    expect(content).toContain('<!-- COMPLETED_SUMMARY_END -->');
    expect(content).toContain('已完成任务摘要');
    expect(content).toContain('[task-001] 用户登录');
  });

  it('appends to existing summary section', async () => {
    await injectCompletedSummary(ctx, completedTask);
    await injectCompletedSummary(ctx, {
      ...completedTask,
      id: 'task-002',
      title: '用户注册',
      completedAt: '2025-01-03T00:00:00Z',
    });
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).toContain('[task-001] 用户登录');
    expect(content).toContain('[task-002] 用户注册');
    // Only one section
    const starts = content.split('<!-- COMPLETED_SUMMARY_START -->').length - 1;
    expect(starts).toBe(1);
  });

  it('preserves base content', async () => {
    await injectCompletedSummary(ctx, completedTask);
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).toContain('基础内容');
  });
});
