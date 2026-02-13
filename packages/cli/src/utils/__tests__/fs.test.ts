import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { readJsonFile, writeJsonFile, writeTextFile, readTextFile, fileExists, ensureDir } from '../fs.js';
import { ConfigSchema } from '../../types/index.js';

describe('fs utils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codinghelper-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('writeJsonFile / readJsonFile', () => {
    it('writes and reads JSON with schema validation', async () => {
      const config = {
        projectName: 'test',
        description: 'desc',
        techStack: {},
        createdAt: '2025-01-01T00:00:00Z',
        currentPhase: 'init' as const,
        version: '1.0.0',
      };
      const filePath = join(tempDir, 'config.json');
      await writeJsonFile(filePath, config);
      const result = await readJsonFile(filePath, ConfigSchema);
      expect(result).toEqual(config);
    });

    it('throws on invalid JSON schema', async () => {
      const filePath = join(tempDir, 'bad.json');
      await writeJsonFile(filePath, { bad: true });
      await expect(readJsonFile(filePath, ConfigSchema)).rejects.toThrow();
    });

    it('creates parent directories', async () => {
      const filePath = join(tempDir, 'a', 'b', 'c.json');
      await writeJsonFile(filePath, { x: 1 });
      expect(await fileExists(filePath)).toBe(true);
    });
  });

  describe('writeTextFile / readTextFile', () => {
    it('writes and reads text', async () => {
      const filePath = join(tempDir, 'test.md');
      await writeTextFile(filePath, '# Hello');
      const content = await readTextFile(filePath);
      expect(content).toBe('# Hello');
    });
  });

  describe('ensureDir', () => {
    it('creates nested directories', async () => {
      const dir = join(tempDir, 'x', 'y', 'z');
      await ensureDir(dir);
      expect(await fileExists(dir)).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('returns true for existing file', async () => {
      const filePath = join(tempDir, 'exists.txt');
      await writeTextFile(filePath, 'hi');
      expect(await fileExists(filePath)).toBe(true);
    });

    it('returns false for non-existing file', async () => {
      expect(await fileExists(join(tempDir, 'nope.txt'))).toBe(false);
    });
  });
});
