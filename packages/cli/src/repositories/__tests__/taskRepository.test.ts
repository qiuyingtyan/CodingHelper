import { describe, it, expect } from 'vitest';
import {
  findNextPendingTask,
  findInProgressTask,
  updateTaskStatus,
} from '../taskRepository.js';
import type { TaskIndex } from '../../types/index.js';

const makeIndex = (): TaskIndex => ({
  tasks: [
    {
      id: 'task-001',
      title: 'First',
      status: 'completed',
      dependencies: [],
      priority: 1,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 'task-002',
      title: 'Second',
      status: 'in_progress',
      dependencies: ['task-001'],
      priority: 2,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: null,
    },
    {
      id: 'task-003',
      title: 'Third',
      status: 'pending',
      dependencies: ['task-001'],
      priority: 3,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: null,
    },
    {
      id: 'task-004',
      title: 'Fourth',
      status: 'pending',
      dependencies: ['task-003'],
      priority: 4,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: null,
    },
  ],
  executionOrder: ['task-001', 'task-002', 'task-003', 'task-004'],
});

describe('taskRepository', () => {
  it('findNextPendingTask returns task with all deps completed', () => {
    const index = makeIndex();
    const next = findNextPendingTask(index);
    expect(next).not.toBeNull();
    expect(next!.id).toBe('task-003');
  });

  it('findNextPendingTask returns null when deps not met', () => {
    const index = makeIndex();
    // Set task-001 to pending — task-003 depends on task-001 so it can't start
    // task-001 has no deps so it would be returned; also set it to in_progress
    index.tasks[0].status = 'in_progress';
    const next = findNextPendingTask(index);
    // task-003 depends on task-001 (not completed), task-004 depends on task-003 (not completed)
    // No pending task has all deps completed
    expect(next).toBeNull();
  });

  it('findInProgressTask returns in_progress task', () => {
    const index = makeIndex();
    const task = findInProgressTask(index);
    expect(task).not.toBeNull();
    expect(task!.id).toBe('task-002');
  });

  it('updateTaskStatus returns new index with updated status', () => {
    const index = makeIndex();
    const updated = updateTaskStatus(index, 'task-003', 'in_progress');
    expect(updated.tasks.find(t => t.id === 'task-003')!.status).toBe('in_progress');
    // Original unchanged
    expect(index.tasks.find(t => t.id === 'task-003')!.status).toBe('pending');
  });

  it('updateTaskStatus merges extra fields', () => {
    const index = makeIndex();
    const updated = updateTaskStatus(index, 'task-002', 'completed', {
      completedAt: '2025-06-01T00:00:00Z',
    });
    const task = updated.tasks.find(t => t.id === 'task-002')!;
    expect(task.status).toBe('completed');
    expect(task.completedAt).toBe('2025-06-01T00:00:00Z');
  });
});
