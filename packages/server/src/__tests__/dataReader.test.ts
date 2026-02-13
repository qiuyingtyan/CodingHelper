import { describe, it, expect, beforeEach } from 'vitest';
import { readProjectData } from '../dataReader.js';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `ch-server-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('dataReader', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = makeTmpDir();
  });

  it('returns nulls when .codinghelper does not exist', async () => {
    const data = await readProjectData(rootDir);
    expect(data.config).toBeNull();
    expect(data.requirements).toBeNull();
    expect(data.spec).toBeNull();
    expect(data.tasks).toBeNull();
    expect(data.logs).toEqual([]);
  });

  it('reads config.json', async () => {
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'config.json'), JSON.stringify({ projectName: 'test' }));

    const data = await readProjectData(rootDir);
    expect(data.config).toEqual({ projectName: 'test' });
  });

  it('reads requirements.md and spec.md', async () => {
    const dir = join(rootDir, '.codinghelper');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'requirements.md'), '# Requirements');
    writeFileSync(join(dir, 'spec.md'), '# Spec');

    const data = await readProjectData(rootDir);
    expect(data.requirements).toBe('# Requirements');
    expect(data.spec).toBe('# Spec');
  });

  it('reads task index', async () => {
    const tasksDir = join(rootDir, '.codinghelper', 'tasks');
    mkdirSync(tasksDir, { recursive: true });
    const index = { tasks: [{ id: 't1', title: 'Task 1' }], executionOrder: ['t1'] };
    writeFileSync(join(tasksDir, 'index.json'), JSON.stringify(index));

    const data = await readProjectData(rootDir);
    expect(data.tasks).toEqual(index);
  });

  it('reads log files', async () => {
    const logsDir = join(rootDir, '.codinghelper', 'logs');
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(join(logsDir, 'debug-1.json'), JSON.stringify({ scope: 'front' }));
    writeFileSync(join(logsDir, 'review-1.json'), JSON.stringify({ status: 'approved' }));

    const data = await readProjectData(rootDir);
    expect(data.logs).toHaveLength(2);
  });
});
