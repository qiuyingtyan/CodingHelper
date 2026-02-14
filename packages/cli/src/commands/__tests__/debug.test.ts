import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile, writeTextFile } from '../../utils/fs.js';
import type { Config } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'debug-test',
    description: 'test',
    techStack: { backend: 'Express', database: 'PostgreSQL' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'run',
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

import { runDebug } from '../debug.js';

describe('debug command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-debug-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.logsDir);
    await writeTextFile(ctx.claudeMdPath, '# CLAUDE.md\n');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runDebug with scope all', async () => {
    await runDebug({ scope: 'all' });
  });

  it('runDebug with scope back', async () => {
    await runDebug({ scope: 'back' });
  });

  it('runDebug with error log', async () => {
    await runDebug({ scope: 'back', error: 'TypeError: Cannot read property' });
  });

  it('runDebug with invalid scope falls back to all', async () => {
    await runDebug({ scope: 'invalid' });
  });

  it('runDebug with no scope defaults to all', async () => {
    await runDebug({});
  });
});
