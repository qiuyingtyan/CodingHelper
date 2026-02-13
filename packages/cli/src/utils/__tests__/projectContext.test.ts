import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { writeJsonFile } from '../fs.js';
import {
  resolveProjectContext,
  buildProjectContext,
  loadConfig,
  saveConfig,
  CODINGHELPER_DIR,
} from '../projectContext.js';
import { ensureDir } from '../fs.js';

describe('projectContext', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codinghelper-ctx-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('buildProjectContext', () => {
    it('builds correct paths', () => {
      const ctx = buildProjectContext('/project');
      expect(ctx.rootDir).toBe('/project');
      expect(ctx.helperDir).toContain(CODINGHELPER_DIR);
      expect(ctx.configPath).toContain('config.json');
      expect(ctx.claudeMdPath).toContain('CLAUDE.md');
    });
  });

  describe('resolveProjectContext', () => {
    it('finds .codinghelper in current dir', async () => {
      await ensureDir(join(tempDir, CODINGHELPER_DIR));
      const ctx = await resolveProjectContext(tempDir);
      expect(ctx.rootDir).toBe(tempDir);
    });

    it('finds .codinghelper in parent dir', async () => {
      await ensureDir(join(tempDir, CODINGHELPER_DIR));
      const subDir = join(tempDir, 'src', 'deep');
      await ensureDir(subDir);
      const ctx = await resolveProjectContext(subDir);
      expect(ctx.rootDir).toBe(tempDir);
    });

    it('throws when not found', async () => {
      const emptyDir = join(tempDir, 'empty');
      await ensureDir(emptyDir);
      await expect(resolveProjectContext(emptyDir)).rejects.toThrow('未找到');
    });
  });

  describe('loadConfig / saveConfig', () => {
    it('round-trips config', async () => {
      const ctx = buildProjectContext(tempDir);
      const config = {
        projectName: 'test',
        description: 'desc',
        techStack: { frontend: 'Vue' },
        createdAt: '2025-01-01T00:00:00Z',
        currentPhase: 'init' as const,
        version: '1.0.0',
      };
      await saveConfig(ctx, config);
      const loaded = await loadConfig(ctx);
      expect(loaded).toEqual(config);
    });
  });
});
