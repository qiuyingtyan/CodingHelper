import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile, writeTextFile, fileExists, readTextFile } from '../../utils/fs.js';
import type { Config } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'spec-test',
    description: 'A test project',
    techStack: { frontend: 'Vue 3', backend: 'Express', database: 'PostgreSQL' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'plan',
    version: '1.0.0',
    ...overrides,
  };
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

vi.mock('../../core/approvalManager.js', () => ({
  requestApproval: vi.fn(async () => ({ approved: true })),
}));

import { runSpec } from '../spec.js';

describe('spec command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-spec-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.tasksDir);
    await ensureDir(ctx.logsDir);
    await writeTextFile(ctx.requirementsPath, '## 功能需求\n\n用户登录注册');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runSpec generates spec and claudeMd', async () => {
    await runSpec();
    expect(await fileExists(ctx.specPath)).toBe(true);
    expect(await fileExists(ctx.claudeMdPath)).toBe(true);
    const spec = await readTextFile(ctx.specPath);
    expect(spec).toContain('spec-test');
  });

  it('runSpec --regenerate overwrites existing spec', async () => {
    await writeTextFile(ctx.specPath, 'old content');
    await runSpec({ regenerate: true });
    const spec = await readTextFile(ctx.specPath);
    expect(spec).not.toContain('old content');
  });

  it('runSpec rejected by approval sets exitCode', async () => {
    const { requestApproval } = await import('../../core/approvalManager.js');
    vi.mocked(requestApproval).mockResolvedValueOnce({ approved: false, feedback: 'needs work' });

    const origExitCode = process.exitCode;
    await runSpec();
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });
});
