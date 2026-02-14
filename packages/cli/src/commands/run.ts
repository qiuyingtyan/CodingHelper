import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { readJsonFile, readTextFile, writeJsonFile } from '../utils/fs.js';
import { TaskIndexSchema } from '../types/index.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printPhaseHeader, printTable, printInfo, printWarning } from '../utils/display.js';
import { injectTaskContext, clearDynamicSections, injectCompletedSummary } from '../core/claudeMdManager.js';
import { appendHistory } from '../core/historyManager.js';
import { join } from 'node:path';

export interface RunOptions {
  resume?: boolean;
  dryRun?: boolean;
  all?: boolean;
}

export async function runRun(opts?: RunOptions): Promise<void> {
  printPhaseHeader('run', '执行任务');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'task');

  const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);

  // --resume: 恢复上次中断的 in_progress 任务
  if (opts?.resume) {
    const inProgress = taskIndex.tasks.find((t) => t.status === 'in_progress');
    if (!inProgress) {
      printWarning('没有正在执行的任务可恢复。');
      return;
    }
    printInfo(`恢复任务：${inProgress.id} — ${inProgress.title}`);
    const taskFilePath = join(ctx.tasksDir, `${inProgress.id}.md`);
    let taskContent = '';
    try {
      taskContent = await readTextFile(taskFilePath);
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(taskContent);
    } catch {
      printWarning(`任务文件 ${taskFilePath} 不存在，跳过内容展示。`);
    }
    await injectTaskContext(ctx, inProgress, taskContent);
    await appendHistory(ctx, { taskId: inProgress.id, action: 'resumed' });
    printInfo('任务上下文已重新注入 CLAUDE.md。');
    return;
  }

  // --all + --dry-run: 展示所有待执行任务（不执行）
  if (opts?.all && opts?.dryRun) {
    const pending = taskIndex.tasks.filter((t) => t.status === 'pending');
    if (pending.length === 0) {
      printSuccess('所有任务已完成！');
      return;
    }
    printInfo(`[Dry Run] 待执行任务（${pending.length} 个）：`);
    printTable(pending);
    return;
  }

  const pendingTasks = taskIndex.tasks.filter((t) => t.status === 'pending');

  if (pendingTasks.length === 0) {
    printSuccess('所有任务已完成！');
    await clearDynamicSections(ctx);
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

  // --dry-run: 仅展示下一个任务，不修改状态
  if (opts?.dryRun) {
    printInfo(`[Dry Run] 下一个任务：${nextTask.id} — ${nextTask.title}`);
    const taskFilePath = join(ctx.tasksDir, `${nextTask.id}.md`);
    try {
      const taskContent = await readTextFile(taskFilePath);
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(taskContent);
    } catch {
      printWarning(`任务文件 ${taskFilePath} 不存在。`);
    }
    printInfo('[Dry Run] 未修改任何状态。');
    return;
  }

  printInfo(`当前任务：${nextTask.id} — ${nextTask.title}`);

  const taskFilePath = join(ctx.tasksDir, `${nextTask.id}.md`);
  let taskContent = '';
  try {
    taskContent = await readTextFile(taskFilePath);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(taskContent);
  } catch {
    printWarning(`任务文件 ${taskFilePath} 不存在，跳过内容展示。`);
  }

  // 注入任务上下文到 CLAUDE.md
  await injectTaskContext(ctx, nextTask, taskContent);
  await appendHistory(ctx, { taskId: nextTask.id, action: 'started' });

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
  await appendHistory(ctx, { taskId: inProgress.id, action: 'completed' });

  // 注入已完成任务摘要到 CLAUDE.md
  const completedTask = updatedTasks.find(t => t.id === inProgress.id)!;
  await injectCompletedSummary(ctx, completedTask);

  // 清除 CLAUDE.md 中的动态注入
  await clearDynamicSections(ctx);

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