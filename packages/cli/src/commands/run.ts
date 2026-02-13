import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { readJsonFile, readTextFile, writeJsonFile } from '../utils/fs.js';
import { TaskIndexSchema } from '../types/index.js';
import type { TaskItem } from '../types/index.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printError, printPhaseHeader, printTable, printInfo, printWarning } from '../utils/display.js';
import { join } from 'node:path';

export async function runRun(): Promise<void> {
  printPhaseHeader('run', '执行任务');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'task');

  const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
  const pendingTasks = taskIndex.tasks.filter((t) => t.status === 'pending');

  if (pendingTasks.length === 0) {
    printSuccess('所有任务已完成！');
    return;
  }

  // 找到下一个可执行的任务（依赖已完成）
  const completedIds = new Set(
    taskIndex.tasks.filter((t) => t.status === 'completed').map((t) => t.id)
  );

  const nextTask = pendingTasks.find((t) =>
    t.dependencies.every((dep) => completedIds.has(dep))
  );

  if (!nextTask) {
    printWarning('存在循环依赖或前置任务未完成，无法继续执行。');
    printTable(pendingTasks);
    process.exitCode = 1;
    return;
  }

  printInfo(`当前任务：${nextTask.id} — ${nextTask.title}`);

  const taskFilePath = join(ctx.tasksDir, `${nextTask.id}.md`);
  try {
    const taskContent = await readTextFile(taskFilePath);
    console.log('');
    console.log(taskContent);
  } catch {
    printWarning(`任务文件 ${taskFilePath} 不存在，跳过内容展示。`);
  }

  printInfo('请将以上任务交给 Claude Code 执行，完成后运行 codinghelper done 标记完成。');

  // 更新任务状态为 in_progress
  const updatedTasks = taskIndex.tasks.map((t) =>
    t.id === nextTask.id ? { ...t, status: 'in_progress' as const } : t
  );
  await writeJsonFile(ctx.taskIndexPath, { ...taskIndex, tasks: updatedTasks });

  const updatedConfig = { ...config, currentPhase: 'run' as const };
  await saveConfig(ctx, updatedConfig);
}

export async function runDone(): Promise<void> {
  printPhaseHeader('done', '标记任务完成');

  const ctx = await resolveProjectContext();
  const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);

  const inProgress = taskIndex.tasks.find((t) => t.status === 'in_progress');

  if (!inProgress) {
    printWarning('没有正在执行的任务。');
    return;
  }

  const updatedTasks = taskIndex.tasks.map((t) =>
    t.id === inProgress.id
      ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
      : t
  );

  await writeJsonFile(ctx.taskIndexPath, { ...taskIndex, tasks: updatedTasks });

  printSuccess(`任务 ${inProgress.id}（${inProgress.title}）已标记为完成。`);

  const remaining = updatedTasks.filter((t) => t.status === 'pending');
  if (remaining.length > 0) {
    printInfo(`剩余 ${remaining.length} 个待执行任务。运行 codinghelper run 继续。`);
  } else {
    printSuccess('🎉 所有任务已完成！');
  }
}

export async function runStatus(): Promise<void> {
  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  printPhaseHeader('status', `项目状态 — ${config.projectName}`);
  printInfo(`当前阶段：${config.currentPhase}`);

  try {
    const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    const completed = taskIndex.tasks.filter((t) => t.status === 'completed').length;
    const total = taskIndex.tasks.length;
    printInfo(`任务进度：${completed}/${total}`);
    printTable(taskIndex.tasks);
  } catch {
    printInfo('尚未生成任务列表。');
  }
}
