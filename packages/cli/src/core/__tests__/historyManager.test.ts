import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadHistory, appendHistory, getTaskHistory, summarizeHistory } from '../historyManager.js';
import type { History } from '../historyManager.js';
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
    __getStore: () => store,
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

describe('historyManager', () => {
  beforeEach(() => {
    fsMock.__resetStore();
  });

  it('loadHistory returns empty when no file exists', async () => {
    const h = await loadHistory(mockCtx);
    expect(h.entries).toEqual([]);
  });

  it('appendHistory adds entry with timestamp', async () => {
    const entry = await appendHistory(mockCtx, { taskId: 'task-001', action: 'started' });
    expect(entry.taskId).toBe('task-001');
    expect(entry.action).toBe('started');
    expect(entry.timestamp).toBeTruthy();
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
  });

  it('appendHistory accumulates entries', async () => {
    await appendHistory(mockCtx, { taskId: 'task-001', action: 'started' });
    await appendHistory(mockCtx, { taskId: 'task-001', action: 'completed' });
    await appendHistory(mockCtx, { taskId: 'task-002', action: 'started' });

    const h = await loadHistory(mockCtx);
    expect(h.entries.length).toBe(3);
  });

  it('appendHistory supports optional note', async () => {
    const entry = await appendHistory(mockCtx, {
      taskId: 'task-001',
      action: 'rejected',
      note: '代码质量不达标',
    });
    expect(entry.note).toBe('代码质量不达标');
  });

  it('getTaskHistory filters by taskId', async () => {
    const history: History = {
      entries: [
        { taskId: 'task-001', action: 'started', timestamp: '2025-01-01T00:00:00Z' },
        { taskId: 'task-002', action: 'started', timestamp: '2025-01-01T01:00:00Z' },
        { taskId: 'task-001', action: 'completed', timestamp: '2025-01-01T02:00:00Z' },
      ],
    };
    const result = getTaskHistory(history, 'task-001');
    expect(result.length).toBe(2);
    expect(result.every((e) => e.taskId === 'task-001')).toBe(true);
  });

  it('summarizeHistory counts actions correctly', () => {
    const history: History = {
      entries: [
        { taskId: 'task-001', action: 'started', timestamp: '2025-01-01T00:00:00Z' },
        { taskId: 'task-001', action: 'completed', timestamp: '2025-01-01T01:00:00Z' },
        { taskId: 'task-002', action: 'started', timestamp: '2025-01-01T02:00:00Z' },
        { taskId: 'task-002', action: 'rejected', timestamp: '2025-01-01T03:00:00Z' },
        { taskId: 'task-002', action: 'resumed', timestamp: '2025-01-01T04:00:00Z' },
      ],
    };
    const summary = summarizeHistory(history);
    expect(summary.total).toBe(5);
    expect(summary.started).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.resumed).toBe(1);
  });
});
