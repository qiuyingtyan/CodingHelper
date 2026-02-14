import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeTextFile, fileExists, readTextFile } from '../../utils/fs.js';
import type { Config } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'plan-test',
    description: 'test',
    techStack: { frontend: 'React', backend: 'Express' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'init',
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

// Mock @inquirer/prompts — plan uses editor and confirm
vi.mock('@inquirer/prompts', () => ({
  editor: vi.fn(async () => '需求内容'),
  confirm: vi.fn(async () => true),
  input: vi.fn(async () => 'test-project'),
  search: vi.fn(async () => 'React'),
}));

import { runPlan } from '../plan.js';

describe('plan command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-plan-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runPlan generates requirements doc', async () => {
    await runPlan();
    expect(await fileExists(ctx.requirementsPath)).toBe(true);
    const doc = await readTextFile(ctx.requirementsPath);
    expect(doc).toContain('plan-test');
  });

  it('runPlan rejected by approval sets exitCode', async () => {
    const { requestApproval } = await import('../../core/approvalManager.js');
    vi.mocked(requestApproval).mockResolvedValueOnce({ approved: false });

    const origExitCode = process.exitCode;
    await runPlan();
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });

  it('runPlan aborts when required section is empty', async () => {
    const { editor } = await import('@inquirer/prompts');
    vi.mocked(editor).mockResolvedValueOnce(''); // First required section empty

    const origExitCode = process.exitCode;
    await runPlan();
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });
});
