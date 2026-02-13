import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { injectTaskContext, injectDebugContext, clearDynamicSections } from '../claudeMdManager.js';
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

const sampleTask: TaskItem = {
  id: 'task-001',
  title: '用户登录',
  status: 'in_progress',
  dependencies: [],
  priority: 1,
  createdAt: '2025-01-01T00:00:00Z',
  completedAt: null,
};

describe('claudeMdManager', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'claude-md-test-'));
    ctx = makeCtx(tmpDir);
    await writeFile(ctx.claudeMdPath, '# CLAUDE.md\n\n基础内容\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('injects task context into CLAUDE.md', async () => {
    await injectTaskContext(ctx, sampleTask, '实现邮箱密码登录');
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).toContain('当前任务：task-001 — 用户登录');
    expect(content).toContain('实现邮箱密码登录');
    expect(content).toContain('<!-- CURRENT_TASK_START -->');
    expect(content).toContain('<!-- CURRENT_TASK_END -->');
    // 基础内容保留
    expect(content).toContain('基础内容');
  });

  it('replaces previous task injection', async () => {
    await injectTaskContext(ctx, sampleTask, '第一次注入');
    await injectTaskContext(ctx, { ...sampleTask, id: 'task-002', title: '注册' }, '第二次注入');
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).not.toContain('第一次注入');
    expect(content).toContain('第二次注入');
    expect(content).toContain('task-002');
  });

  it('injects debug context', async () => {
    await injectDebugContext(ctx, '检查数据库连接');
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).toContain('Debug 上下文');
    expect(content).toContain('检查数据库连接');
  });

  it('clears all dynamic sections', async () => {
    await injectTaskContext(ctx, sampleTask, '任务内容');
    await injectDebugContext(ctx, 'debug 内容');
    await clearDynamicSections(ctx);
    const content = await readFile(ctx.claudeMdPath, 'utf-8');
    expect(content).not.toContain('CURRENT_TASK_START');
    expect(content).not.toContain('DEBUG_CONTEXT_START');
    expect(content).toContain('基础内容');
  });

  it('does nothing if CLAUDE.md does not exist', async () => {
    const { rm: rmFile } = await import('node:fs/promises');
    await rmFile(ctx.claudeMdPath);
    // Should not throw
    await injectTaskContext(ctx, sampleTask, 'test');
    await clearDynamicSections(ctx);
  });
});
