import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDir, writeJsonFile } from '../../utils/fs.js';
import { buildProjectContext } from '../../utils/projectContext.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import type { Config, TaskIndex } from '../../types/index.js';
import {
  startNextTask,
  resumeCurrentTask,
  completeCurrentTask,
  getProgress,
} from '../taskService.js';

function makeConfig(phase: Config['currentPhase'] = 'task'): Config {
  return {
    projectName: 'Test',
    description: '',
    techStack: {},
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: phase,
    version: '1.0.0',
  };
}

function makeTaskIndex(overrides?: Partial<TaskIndex>): TaskIndex {
  return {
    tasks: [
      { id: 'task-001', title: '登录', status: 'pending', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      { id: 'task-002', title: '注册', status: 'pending', dependencies: ['task-001'], priority: 2, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
    ],
    executionOrder: ['task-001', 'task-002'],
    ...overrides,
  };
}

describe('taskService', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'task-svc-'));
    ctx = buildProjectContext(tmpDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
    await writeJsonFile(ctx.configPath, makeConfig());
    await writeFile(ctx.claudeMdPath, '# CLAUDE.md\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('startNextTask picks first pending task with resolved deps', async () => {
    await writeJsonFile(ctx.taskIndexPath, makeTaskIndex());
    await writeFile(join(ctx.tasksDir, 'task-001.md'), '# 登录任务', 'utf-8');

    const result = await startNextTask(ctx);
    expect(result.task.id).toBe('task-001');
    expect(result.task.title).toBe('登录');
    expect(result.content).toContain('登录任务');
  });

  it('startNextTask throws CircularDependencyError when deps unresolved', async () => {
    const index = makeTaskIndex({
      tasks: [
        { id: 'task-001', title: 'A', status: 'pending', dependencies: ['task-002'], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
        { id: 'task-002', title: 'B', status: 'pending', dependencies: ['task-001'], priority: 2, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      ],
    });
    await writeJsonFile(ctx.taskIndexPath, index);

    await expect(startNextTask(ctx)).rejects.toThrow('循环依赖');
  });

  it('startNextTask throws when all tasks completed', async () => {
    const index = makeTaskIndex({
      tasks: [
        { id: 'task-001', title: 'A', status: 'completed', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: '2025-01-02T00:00:00Z' },
      ],
    });
    await writeJsonFile(ctx.taskIndexPath, index);

    await expect(startNextTask(ctx)).rejects.toThrow('所有任务已完成');
  });

  it('resumeCurrentTask returns in_progress task', async () => {
    const index = makeTaskIndex({
      tasks: [
        { id: 'task-001', title: '登录', status: 'in_progress', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      ],
    });
    await writeJsonFile(ctx.taskIndexPath, index);
    await writeFile(join(ctx.tasksDir, 'task-001.md'), '# 内容', 'utf-8');

    const result = await resumeCurrentTask(ctx);
    expect(result).not.toBeNull();
    expect(result!.task.id).toBe('task-001');
  });

  it('resumeCurrentTask returns null when no in_progress task', async () => {
    await writeJsonFile(ctx.taskIndexPath, makeTaskIndex());
    const result = await resumeCurrentTask(ctx);
    expect(result).toBeNull();
  });

  it('completeCurrentTask marks task completed and returns it', async () => {
    const index = makeTaskIndex({
      tasks: [
        { id: 'task-001', title: '登录', status: 'in_progress', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      ],
    });
    await writeJsonFile(ctx.taskIndexPath, index);
    await writeFile(join(ctx.tasksDir, 'task-001.md'), '# 内容', 'utf-8');

    const result = await completeCurrentTask(ctx);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('task-001');
    expect(result!.status).toBe('completed');
    expect(result!.completedAt).toBeTruthy();
  });

  it('completeCurrentTask returns null when no in_progress task', async () => {
    await writeJsonFile(ctx.taskIndexPath, makeTaskIndex());
    const result = await completeCurrentTask(ctx);
    expect(result).toBeNull();
  });

  it('getProgress returns correct counts', async () => {
    const index = makeTaskIndex({
      tasks: [
        { id: 'task-001', title: 'A', status: 'completed', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: '2025-01-02T00:00:00Z' },
        { id: 'task-002', title: 'B', status: 'in_progress', dependencies: [], priority: 2, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
        { id: 'task-003', title: 'C', status: 'pending', dependencies: [], priority: 3, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      ],
    });
    await writeJsonFile(ctx.taskIndexPath, index);

    const progress = await getProgress(ctx);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(1);
    expect(progress.inProgress).toBe(1);
    expect(progress.pending).toBe(1);
    expect(progress.tasks).toHaveLength(3);
  });
});
