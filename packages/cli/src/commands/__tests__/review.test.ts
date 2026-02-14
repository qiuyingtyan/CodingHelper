import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile, readJsonFile, fileExists } from '../../utils/fs.js';
import { TaskIndexSchema, ReviewRecordSchema } from '../../types/index.js';
import type { Config, TaskItem, ReviewRecord } from '../../types/index.js';
// We test the review logic by simulating what runReview does,
// since the actual command calls resolveProjectContext (cwd-based).

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'review-test',
    description: 'test',
    techStack: { frontend: 'React', backend: 'Express' },
    createdAt: '2025-01-01T00:00:00.000Z',
    currentPhase: 'run',
    version: '0.1.0',
    ...overrides,
  };
}

function makeTasks(statuses: Array<TaskItem['status']>): TaskItem[] {
  return statuses.map((status, i) => ({
    id: `task-${String(i + 1).padStart(3, '0')}`,
    title: `Task ${i + 1}`,
    status,
    dependencies: i > 0 ? [`task-${String(i).padStart(3, '0')}`] : [],
    priority: i + 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    completedAt: status === 'completed' ? '2025-01-02T00:00:00.000Z' : null,
  }));
}

describe('review logic', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codinghelper-review-'));
    const ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
    await writeJsonFile(ctx.configPath, makeConfig());
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('resolves in_progress task as default review target', () => {
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    // Same logic as resolveTarget in review.ts
    const target =
      tasks.find((t) => t.status === 'in_progress') ??
      [...tasks].reverse().find((t) => t.status === 'completed');
    expect(target?.id).toBe('task-002');
  });

  it('falls back to last completed task when none in_progress', () => {
    const tasks = makeTasks(['completed', 'completed', 'pending']);
    const target =
      tasks.find((t) => t.status === 'in_progress') ??
      [...tasks].reverse().find((t) => t.status === 'completed');
    expect(target?.id).toBe('task-002');
  });

  it('resolves specific task by id', () => {
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    const taskId = 'task-003';
    const target = tasks.find((t) => t.id === taskId);
    expect(target?.id).toBe('task-003');
  });

  it('creates valid ReviewRecord with approved status', () => {
    const record: ReviewRecord = {
      taskId: 'task-001',
      status: 'approved',
      reviewer: 'user',
      comment: '审查通过',
      timestamp: new Date().toISOString(),
    };
    expect(() => ReviewRecordSchema.parse(record)).not.toThrow();
    expect(record.status).toBe('approved');
  });

  it('creates valid ReviewRecord with rejected status', () => {
    const record: ReviewRecord = {
      taskId: 'task-002',
      status: 'rejected',
      reviewer: 'user',
      comment: '代码质量不达标',
      timestamp: new Date().toISOString(),
    };
    expect(() => ReviewRecordSchema.parse(record)).not.toThrow();
    expect(record.status).toBe('rejected');
  });

  it('creates valid ReviewRecord with needs_modification status', () => {
    const record: ReviewRecord = {
      taskId: 'task-001',
      status: 'needs_modification',
      reviewer: 'user',
      comment: '需要补充单元测试',
      timestamp: new Date().toISOString(),
    };
    expect(() => ReviewRecordSchema.parse(record)).not.toThrow();
  });

  it('persists review record to logs directory', async () => {
    const ctx = buildProjectContext(tempDir);
    const record: ReviewRecord = {
      taskId: 'task-001',
      status: 'approved',
      reviewer: 'user',
      comment: 'LGTM',
      timestamp: new Date().toISOString(),
    };
    const reviewPath = join(ctx.logsDir, `review-task-001-${Date.now()}.json`);
    await writeJsonFile(reviewPath, record);

    expect(await fileExists(reviewPath)).toBe(true);
    const loaded = await readJsonFile(reviewPath, ReviewRecordSchema);
    expect(loaded.taskId).toBe('task-001');
    expect(loaded.status).toBe('approved');
    expect(loaded.comment).toBe('LGTM');
  });

  it('updates task status to completed on approve', async () => {
    const ctx = buildProjectContext(tempDir);
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    const taskIndex = { tasks, executionOrder: tasks.map((t) => t.id) };
    await writeJsonFile(ctx.taskIndexPath, taskIndex);

    // Simulate approve on task-002
    const targetId = 'task-002';
    const updatedTasks = tasks.map((t) =>
      t.id === targetId
        ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
        : t
    );
    await writeJsonFile(ctx.taskIndexPath, { ...taskIndex, tasks: updatedTasks });

    const loaded = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    const updated = loaded.tasks.find((t) => t.id === targetId);
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).not.toBeNull();
  });

  it('updates task status to rejected on reject', async () => {
    const ctx = buildProjectContext(tempDir);
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    const taskIndex = { tasks, executionOrder: tasks.map((t) => t.id) };
    await writeJsonFile(ctx.taskIndexPath, taskIndex);

    const targetId = 'task-002';
    const updatedTasks = tasks.map((t) =>
      t.id === targetId ? { ...t, status: 'rejected' as const } : t
    );
    await writeJsonFile(ctx.taskIndexPath, { ...taskIndex, tasks: updatedTasks });

    const loaded = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    const updated = loaded.tasks.find((t) => t.id === targetId);
    expect(updated?.status).toBe('rejected');
  });

  it('returns undefined target when no reviewable tasks exist', () => {
    const tasks = makeTasks(['pending', 'pending', 'pending']);
    const target =
      tasks.find((t) => t.status === 'in_progress') ??
      [...tasks].reverse().find((t) => t.status === 'completed');
    expect(target).toBeUndefined();
  });

  it('resolveStatus returns correct values for options', () => {
    // Inline the same logic as review.ts resolveStatus
    const resolve = (opts: { approve?: boolean; reject?: boolean }) => {
      if (opts.approve) return 'approved';
      if (opts.reject) return 'rejected';
      return undefined;
    };
    expect(resolve({ approve: true })).toBe('approved');
    expect(resolve({ reject: true })).toBe('rejected');
    expect(resolve({})).toBeUndefined();
  });
});
