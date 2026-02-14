import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDir, writeJsonFile, readJsonFile } from '../../utils/fs.js';
import { buildProjectContext } from '../../utils/projectContext.js';
import { ConfigSchema } from '../../types/index.js';
import type { ProjectContext } from '../../utils/projectContext.js';
import type { Config } from '../../types/index.js';
import { getConfig, setConfig, updatePhase } from '../configRepository.js';

const baseConfig: Config = {
  projectName: 'Test',
  description: 'desc',
  techStack: { frontend: 'Vue' },
  createdAt: '2025-01-01T00:00:00Z',
  currentPhase: 'init',
  version: '1.0.0',
};

describe('configRepository', () => {
  let tmpDir: string;
  let ctx: ProjectContext;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cfg-repo-'));
    ctx = buildProjectContext(tmpDir);
    await ensureDir(ctx.helperDir);
    await writeJsonFile(ctx.configPath, baseConfig);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('getConfig loads and validates config', async () => {
    const config = await getConfig(ctx);
    expect(config.projectName).toBe('Test');
    expect(config.currentPhase).toBe('init');
    expect(config.techStack.frontend).toBe('Vue');
  });

  it('setConfig persists config', async () => {
    const updated = { ...baseConfig, projectName: 'Updated' };
    await setConfig(ctx, updated);

    const loaded = await readJsonFile(ctx.configPath, ConfigSchema);
    expect(loaded.projectName).toBe('Updated');
  });

  it('updatePhase changes only the phase', async () => {
    await updatePhase(ctx, 'plan');
    const config = await getConfig(ctx);
    expect(config.currentPhase).toBe('plan');
    expect(config.projectName).toBe('Test');
  });

  it('updatePhase can advance through all phases', async () => {
    const phases = ['plan', 'spec', 'task', 'run', 'debug'] as const;
    for (const phase of phases) {
      await updatePhase(ctx, phase);
      const config = await getConfig(ctx);
      expect(config.currentPhase).toBe(phase);
    }
  });
});
