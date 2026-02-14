import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compactHistory, loadHistory, appendHistory } from '../historyManager.js';
import type { ProjectContext } from '../../utils/projectContext.js';

vi.mock('../../utils/fs.js', () => {
  let store: Record<string, string> = {};
  return {
    readJsonFile: vi.fn(async (path: string) => JSON.parse(store[path] ?? '{}')),
    writeJsonFile: vi.fn(async (path: string, data: unknown) => {
      store[path] = JSON.stringify(data);
    }),
    fileExists: vi.fn(async (path: string) => path in store),
    ensureDir: vi.fn(),
    __resetStore: () => { store = {}; },
  };
});

const mockCtx: ProjectContext = {
  rootDir: '/fake',
  helperDir: '/fake/.codinghelper',
  configPath: '/fake/.codinghelper/config.json',
  requirementsPath: '/fake/.codinghelper/requirements.md',
  specPath: '/fake/.codinghelper/spec.md',
  tasksDir: '/fake/.codinghelper/tasks',
  taskIndexPath: '/fake/.codinghelper/tasks/index.json',
  claudeMdPath: '/fake/CLAUDE.md',
  logsDir: '/fake/.codinghelper/logs',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fsMock = vi.mocked(await import('../../utils/fs.js')) as any;

describe('historyManager - compactHistory', () => {
  beforeEach(() => {
    fsMock.__resetStore();
  });

  it('does nothing when entries <= keepRecent', async () => {
    await appendHistory(mockCtx, { taskId: 't1', action: 'started' });
    await appendHistory(mockCtx, { taskId: 't1', action: 'completed' });

    const result = await compactHistory(mockCtx, 10);
    expect(result.archived).toBe(0);
    expect(result.remaining).toBe(2);
  });

  it('archives old entries and keeps recent ones', async () => {
    // Seed 10 entries
    for (let i = 0; i < 10; i++) {
      await appendHistory(mockCtx, { taskId: `t${i}`, action: 'started' });
    }

    const result = await compactHistory(mockCtx, 3);
    expect(result.archived).toBe(7);
    expect(result.remaining).toBe(3);

    const history = await loadHistory(mockCtx);
    expect(history.entries.length).toBe(3);
  });

  it('auto-compacts when threshold exceeded', async () => {
    // Seed 101 entries via appendHistory to trigger auto-compact
    for (let i = 0; i < 101; i++) {
      await appendHistory(mockCtx, { taskId: `t${i}`, action: 'started' });
    }

    const history = await loadHistory(mockCtx);
    // After auto-compact at 101 entries, should keep DEFAULT_KEEP_RECENT (50)
    expect(history.entries.length).toBe(50);
  });
});
