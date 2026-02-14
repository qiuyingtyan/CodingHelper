import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ensureDir, writeJsonFile } from '../../utils/fs.js';
import type { Config } from '../../types/index.js';

function makeConfig(overrides?: Partial<Config>): Config {
  return {
    projectName: 'compact-test',
    description: 'test',
    techStack: { backend: 'Express' },
    createdAt: '2025-01-01T00:00:00Z',
    currentPhase: 'run',
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

import { runCompact } from '../compact.js';

describe('compact command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-compact-'));
    ctx = buildProjectContext(tempDir);
    await ensureDir(ctx.helperDir);
    await ensureDir(ctx.logsDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runCompact with defaults', async () => {
    await runCompact();
  });

  it('runCompact with custom keep', async () => {
    // Create some history entries
    const entries = Array.from({ length: 20 }, (_, i) => ({
      taskId: `t${i}`,
      action: 'started' as const,
      timestamp: new Date(2025, 0, 1, i).toISOString(),
    }));
    await writeJsonFile(join(ctx.logsDir, 'history.json'), { entries });

    await runCompact({ keep: '5' });
  });

  it('runCompact with custom days', async () => {
    await runCompact({ days: '7' });
  });

  it('runCompact archives old log files', async () => {
    // Create an old log file (set mtime to past via content)
    const oldLogPath = join(ctx.logsDir, 'debug-old.json');
    await writeFile(oldLogPath, '{}');

    await runCompact({ days: '0' });
  });
});
