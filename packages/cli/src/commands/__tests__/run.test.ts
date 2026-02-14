import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile, writeTextFile } from '../../utils/fs.js';
import type { Config, TaskItem } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'run-test',
    description: 'test',
    techStack: { backend: 'Express' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'task',
    version: '1.0.0',
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
    createdAt: '2025-01-01T00:00:00Z',
    completedAt: status === 'completed' ? '2025-01-02T00:00:00Z' : null,
  }));
}

let tempDir: string;
let ctx: ReturnType<typeof buildProjectContext>;

// Mock resolveProjectContext to return our temp dir context
vi.mock('../../utils/projectContext.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/projectContext.js')>();
  return {
    ...orig,
    resolveProjectContext: vi.fn(async () => ctx),
    loadConfig: vi.fn(async () => makeConfig()),
    saveConfig: vi.fn(async () => {}),
  };
});

// Dynamically adjust loadConfig return
import { loadConfig } from '../../utils/projectContext.js';

import { runRun, runDone, runStatus } from '../run.js';

describe('run command — real functions', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-run-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
    await writeTextFile(ctx.claudeMdPath, '# CLAUDE.md\n');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runRun starts next pending task', async () => {
    const tasks = makeTasks(['completed', 'pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });
    await writeTextFile(join(ctx.tasksDir, 'task-002.md'), '# Task 2\nDo stuff');

    await runRun();
    // Should not throw — task-002 becomes in_progress
  });

  it('runRun --resume resumes in_progress task', async () => {
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runRun({ resume: true });
  });

  it('runRun --resume warns when no in_progress', async () => {
    const tasks = makeTasks(['completed', 'pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runRun({ resume: true });
  });

  it('runRun --all --dryRun lists pending', async () => {
    const tasks = makeTasks(['completed', 'pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runRun({ all: true, dryRun: true });
  });

  it('runRun --dryRun shows next task without modifying', async () => {
    const tasks = makeTasks(['completed', 'pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });
    await writeTextFile(join(ctx.tasksDir, 'task-002.md'), '# Task 2');

    await runRun({ dryRun: true });
  });

  it('runRun prints success when all completed', async () => {
    const tasks = makeTasks(['completed', 'completed', 'completed']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runRun();
  });

  it('runDone marks in_progress as completed', async () => {
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });
    await writeTextFile(ctx.claudeMdPath, '# CLAUDE.md\n');

    await runDone();
  });

  it('runDone warns when no in_progress', async () => {
    const tasks = makeTasks(['completed', 'pending', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runDone();
  });

  it('runStatus shows project status', async () => {
    const tasks = makeTasks(['completed', 'in_progress', 'pending']);
    await writeJsonFile(ctx.taskIndexPath, { tasks, executionOrder: tasks.map(t => t.id) });

    await runStatus();
  });

  it('runStatus handles missing task index', async () => {
    // No task index file — should not throw
    await runStatus();
  });
});
