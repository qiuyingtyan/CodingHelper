import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile, writeTextFile } from '../../utils/fs.js';
import type { Config, TaskItem } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'review-test',
    description: 'test',
    techStack: { backend: 'Express' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'run',
    version: '1.0.0',
    ...overrides,
  };
}

function makeTasks(statuses: Array<TaskItem['status']>): TaskItem[] {
  return statuses.map((status, i) => ({
    id: `task-${String(i + 1).padStart(3, '0')}`,
    title: `Task ${i + 1}`,
    status,
    dependencies: [],
    priority: i + 1,
    createdAt: '2025-01-01T00:00:00Z',
    completedAt: status === 'completed' ? '2025-01-02T00:00:00Z' : null,
  }));
}

let tempDir: string;
let ctx: ReturnType<typeof buildProjectContext>;

vi.mock('../../utils/projectContext.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/projectContext.js')>();
  return {
    ...orig,
    resolveProjectContext: vi.fn(async () => ctx),
    loadConfig: vi.fn(async () => makeConfig()),
    saveConfig: vi.fn(async () => {}),
  };
});

import { runReview } from '../review.js';

describe('review command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-review-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runReview --approve approves completed task', async () => {
    const tasks = makeTasks(['completed', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({ approve: true });
  });

  it('runReview --reject rejects in_progress task', async () => {
    const tasks = makeTasks(['completed', 'in_progress']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({ reject: true, comment: '需要修改' });
  });

  it('runReview with specific task id', async () => {
    const tasks = makeTasks(['completed', 'completed']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({ approve: true, task: 'task-001' });
  });

  it('runReview without action shows task info', async () => {
    const tasks = makeTasks(['completed', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({});
  });

  it('runReview throws InvalidReviewTargetError when no reviewable task', async () => {
    const tasks = makeTasks(['pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await expect(runReview({ approve: true })).rejects.toThrow('没有找到可审查的任务');
  });

  it('runReview --reject with default comment', async () => {
    const tasks = makeTasks(['in_progress']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({ reject: true });
  });

  it('runReview --approve with custom comment', async () => {
    const tasks = makeTasks(['completed']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runReview({ approve: true, comment: 'Looks great!' });
  });
});
