import {
  resolveProjectContext,
  loadConfig,
} from '../utils/projectContext.js';
import { readJsonFile, writeJsonFile } from '../utils/fs.js';
import { TaskIndexSchema, ReviewRecordSchema } from '../types/index.js';
import type { ReviewRecord, ReviewStatus, TaskItem } from '../types/index.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printInfo, printPhaseHeader, printWarning, printTable } from '../utils/display.js';
import { join } from 'node:path';

export interface ReviewOptions {
  approve?: boolean;
  reject?: boolean;
  comment?: string;
  task?: string;
}

export async function runReview(options: ReviewOptions): Promise<void> {
  printPhaseHeader('review', '任务审查');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'run');

  const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);

  // 确定要审查的任务
  const target = resolveTarget(taskIndex.tasks, options.task);
  if (!target) {
    printWarning('没有找到可审查的任务。只有 completed 或 in_progress 状态的任务可以审查。');
    printTable(taskIndex.tasks);
    return;
  }

  // 确定审查结果
  const status = resolveStatus(options);
  if (!status) {
    // 没有指定操作，展示任务信息供用户查看
    printInfo(`待审查任务：${target.id} — ${target.title}（${target.status}）`);
    printInfo('使用 --approve 或 --reject 标记审查结果。');
    return;
  }

  const comment = options.comment ?? (status === 'approved' ? '审查通过' : '审查未通过，需要修改');

  // 创建审查记录
  const record: ReviewRecord = {
    taskId: target.id,
    status,
    reviewer: 'user',
    comment,
    timestamp: new Date().toISOString(),
  };

  // 验证记录
  ReviewRecordSchema.parse(record);

  // 保存审查记录
  const reviewPath = join(ctx.logsDir, `review-${target.id}-${Date.now()}.json`);
  await writeJsonFile(reviewPath, record);

  // 更新任务状态
  const newTaskStatus = status === 'approved' ? 'completed' as const : 'rejected' as const;
  const updatedTasks = taskIndex.tasks.map((t) =>
    t.id === target.id
      ? { ...t, status: newTaskStatus, completedAt: status === 'approved' ? new Date().toISOString() : t.completedAt }
      : t
  );
  await writeJsonFile(ctx.taskIndexPath, { ...taskIndex, tasks: updatedTasks });

  if (status === 'approved') {
    printSuccess(`任务 ${target.id}（${target.title}）审查通过。`);
  } else if (status === 'rejected') {
    printWarning(`任务 ${target.id}（${target.title}）被驳回，状态已设为 rejected。`);
    printInfo(`原因：${comment}`);
  } else {
    printInfo(`任务 ${target.id}（${target.title}）需要修改。`);
    printInfo(`备注：${comment}`);
  }

  printInfo(`审查记录已保存：${reviewPath}`);
}

function resolveTarget(tasks: readonly TaskItem[], taskId?: string): TaskItem | undefined {
  if (taskId) {
    return tasks.find((t) => t.id === taskId);
  }
  // 默认找最近完成或正在执行的任务
  return (
    tasks.find((t) => t.status === 'in_progress') ??
    [...tasks].reverse().find((t) => t.status === 'completed')
  );
}

function resolveStatus(options: ReviewOptions): ReviewStatus | undefined {
  if (options.approve) return 'approved';
  if (options.reject) return 'rejected';
  return undefined;
}
