import { readJsonFile, writeJsonFile } from '../utils/fs.js';
import { TaskIndexSchema } from '../types/index.js';
import type { TaskItem, TaskIndex } from '../types/index.js';
import type { ProjectContext } from '../utils/projectContext.js';
import { TaskNotFoundError } from '../errors/domainErrors.js';

export async function loadTaskIndex(ctx: ProjectContext): Promise<TaskIndex> {
  return readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
}

export async function saveTaskIndex(ctx: ProjectContext, index: TaskIndex): Promise<void> {
  await writeJsonFile(ctx.taskIndexPath, index);
}

export function findTaskById(index: TaskIndex, taskId: string): TaskItem {
  const task = index.tasks.find(t => t.id === taskId);
  if (!task) throw new TaskNotFoundError(taskId);
  return task;
}

export function findNextPendingTask(index: TaskIndex): TaskItem | null {
  const completedIds = new Set(
    index.tasks.filter(t => t.status === 'completed').map(t => t.id),
  );
  const pending = index.tasks.filter(t => t.status === 'pending');
  return pending.find(t => t.dependencies.every(dep => completedIds.has(dep))) ?? null;
}

export function findInProgressTask(index: TaskIndex): TaskItem | null {
  return index.tasks.find(t => t.status === 'in_progress') ?? null;
}

export function updateTaskStatus(
  index: TaskIndex,
  taskId: string,
  status: TaskItem['status'],
  extra?: Partial<TaskItem>,
): TaskIndex {
  return {
    ...index,
    tasks: index.tasks.map(t =>
      t.id === taskId ? { ...t, status, ...extra } : t,
    ),
  };
}
