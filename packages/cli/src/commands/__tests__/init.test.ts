import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildProjectContext } from '../../utils/projectContext.js';
import { fileExists, readJsonFile } from '../../utils/fs.js';
import { ConfigSchema } from '../../types/index.js';
import type { Config } from '../../types/index.js';

let tempDir: string;

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(async (opts: { default?: string }) => opts.default ?? 'test-project'),
  search: vi.fn(async () => '__skip__'),
  confirm: vi.fn(async () => true),
  editor: vi.fn(async () => ''),
}));

import { runInit } from '../init.js';

describe('init command — real function', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ch-init-'));
    // Override process.cwd for init
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('runInit creates project config', async () => {
    await runInit();
    const ctx = buildProjectContext(tempDir);
    expect(await fileExists(ctx.configPath)).toBe(true);
    const config = await readJsonFile(ctx.configPath, ConfigSchema);
    expect(config.currentPhase).toBe('init');
  });

  it('runInit with template', async () => {
    await runInit({ template: 'react-express' });
    const ctx = buildProjectContext(tempDir);
    expect(await fileExists(ctx.configPath)).toBe(true);
    const config = await readJsonFile(ctx.configPath, ConfigSchema);
    expect(config.techStack.frontend).toBeTruthy();
  });

  it('runInit with unknown template sets exitCode', async () => {
    const origExitCode = process.exitCode;
    await runInit({ template: 'nonexistent-template' });
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });

  it('runInit rejects if already initialized', async () => {
    // First init
    await runInit();
    // Second init should fail
    const origExitCode = process.exitCode;
    await runInit();
    expect(process.exitCode).toBe(1);
    process.exitCode = origExitCode;
  });
});
