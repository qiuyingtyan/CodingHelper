import { describe, it, expect, beforeEach } from 'vitest';
import { readConfig, readTasks, readSpec, readRequirements, readLogs } from '../dataReader.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `ch-dr-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('dataReader - individual readers', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = makeTmpDir();
  });

  it('readConfig returns null when missing', async () => {
    expect(await readConfig(rootDir)).toBeNull();
  });

  it('readConfig returns parsed JSON', async () => {
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'config.json'), '{"name":"test"}');
    const config = await readConfig(rootDir);
    expect(config).toEqual({ name: 'test' });
  });

  it('readTasks returns null when missing', async () => {
    expect(await readTasks(rootDir)).toBeNull();
  });

  it('readSpec returns null when missing', async () => {
    expect(await readSpec(rootDir)).toBeNull();
  });

  it('readSpec returns content', async () => {
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'spec.md'), '# Spec');
    expect(await readSpec(rootDir)).toBe('# Spec');
  });

  it('readRequirements returns content', async () => {
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'requirements.md'), '# Req');
    expect(await readRequirements(rootDir)).toBe('# Req');
  });

  it('readLogs returns empty array when no logs dir', async () => {
    expect(await readLogs(rootDir)).toEqual([]);
  });

  it('readLogs supports limit and offset', async () => {
    const logsDir = join(rootDir, '.codinghelper', 'logs');
    mkdirSync(logsDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(logsDir, `log-${i}.json`), JSON.stringify({ i }));
    }
    const logs = await readLogs(rootDir, { limit: 2, offset: 1 });
    expect(logs).toHaveLength(2);
  });
});
