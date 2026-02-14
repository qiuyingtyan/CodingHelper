import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeTextFile, fileExists, readJsonFile } from '../../utils/fs.js';
import { TaskIndexSchema } from '../../types/index.js';
import type { Config } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'task-test',
    description: 'test',
    techStack: { backend: 'Express' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'spec',
    version: '1.0.0',
    ...overrides,
  };
}

let tempDir: string;
let ctx: ReturnType<typeof buildProjectContext>;

vi.mock('../../utils/projectContext.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return {
    ...orig,
    resolveProjectContext: vi.fn(async () => ctx),
    loadConfig: vi.fn(async () => makeConfig()),
    saveConfig: vi.fn(async () => {}),
  };
});

vi.mock('../../core/approvalManager.js', () => ({
  requestApproval: vi.fn(async () => ({ approved: true })),
}));

import { runTask } from '../task.js';

describe('task command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-task-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
    await writeTextFile(ctx.requirementsPath, '## 用户认证\n\n实现登录注册\n\n## API 接口\n\n实现 REST API');
    await writeTextFile(ctx.specPath, '# Spec\n\nTech spec content');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runTask splits requirements and saves tasks', async () => {
    await runTask();
    expect(await fileExists(ctx.taskIndexPath)).toBe(true);
    const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    expect(taskIndex.tasks.length).toBeGreaterThanOrEqual(2);
  });

  it('runTask creates individual task markdown files', async () => {
    await runTask();
    const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    for (const task of taskIndex.tasks) {
      expect(await fileExists(join(ctx.tasksDir, `${task.id}.md`))).toBe(true);
    }
  });

  it('runTask rejected by approval sets exitCode', async () => {
    const { requestApproval } = await import('../../core/approvalManager.js');
    vi.mocked(requestApproval).mockResolvedValueOnce({ approved: false });

    const origExitCode = process.exitCode;
    await runTask();
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });
});
