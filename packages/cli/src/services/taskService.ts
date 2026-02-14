import type { ProjectContext } from '../utils/projectContext.js';
import type { TaskItem } from '../types/index.js';
import {
  loadTaskIndex,
  saveTaskIndex,
  findNextPendingTask,
  findInProgressTask,
  updateTaskStatus,
} from '../repositories/taskRepository.js';
import { appendHistory } from '../repositories/historyRepository.js';
import { injectTaskContext, clearDynamicSections, injectCompletedSummary } from '../core/claudeMdManager.js';
import { readTextFile } from '../utils/fs.js';
import { join } from 'node:path';
import { CircularDependencyError } from '../errors/domainErrors.js';

export interface StartTaskResult {
  task: TaskItem;
  content: string;
}

export async function startNextTask(ctx: ProjectContext): Promise<StartTaskResult> {
  const index = await loadTaskIndex(ctx);
  const task = findNextPendingTask(index);

  if (!task) {
    const pending = index.tasks.filter(t => t.status === 'pending');
    if (pending.length === 0) {
      throw new Error('所有任务已完成。');
    }
    throw new CircularDependencyError();
  }

  const content = await readTaskContent(ctx, task.id);
  await injectTaskContext(ctx, task, content);
  await appendHistory(ctx, { taskId: task.id, action: 'started' });

  const updated = updateTaskStatus(index, task.id, 'in_progress');
  await saveTaskIndex(ctx, updated);

  return { task, content };
}

export async function resumeCurrentTask(ctx: ProjectContext): Promise<StartTaskResult | null> {
  const index = await loadTaskIndex(ctx);
  const task = findInProgressTask(index);
  if (!task) return null;

  const content = await readTaskContent(ctx, task.id);
  await injectTaskContext(ctx, task, content);
  await appendHistory(ctx, { taskId: task.id, action: 'resumed' });

  return { task, content };
}

export async function completeCurrentTask(ctx: ProjectContext): Promise<TaskItem | null> {
  const index = await loadTaskIndex(ctx);
  const task = findInProgressTask(index);
  if (!task) return null;

  const updated = updateTaskStatus(index, task.id, 'completed', {
    completedAt: new Date().toISOString(),
  });
  await saveTaskIndex(ctx, updated);
  await appendHistory(ctx, { taskId: task.id, action: 'completed' });

  const completedTask = updated.tasks.find(t => t.id === task.id)!;
  await injectCompletedSummary(ctx, completedTask);
  await clearDynamicSections(ctx);

  return completedTask;
}

export async function getProgress(ctx: ProjectContext): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  tasks: TaskItem[];
}> {
  const index = await loadTaskIndex(ctx);
  return {
    total: index.tasks.length,
    completed: index.tasks.filter(t => t.status === 'completed').length,
    inProgress: index.tasks.filter(t => t.status === 'in_progress').length,
    pending: index.tasks.filter(t => t.status === 'pending').length,
    tasks: index.tasks,
  };
}

async function readTaskContent(ctx: ProjectContext, taskId: string): Promise<string> {
  try {
    return await readTextFile(join(ctx.tasksDir, `${taskId}.md`));
  } catch {
    return '';
  }
}
