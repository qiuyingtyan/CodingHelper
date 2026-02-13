import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { readTextFile, writeTextFile, writeJsonFile } from '../utils/fs.js';
import { splitRequirementsIntoTasks, generateTaskMarkdown } from '../core/taskSplitter.js';
import { requestApproval } from '../core/approvalManager.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printError, printPhaseHeader, printTable, printInfo } from '../utils/display.js';
import { join } from 'node:path';

export async function runTask(): Promise<void> {
  printPhaseHeader('task', '任务拆分');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'spec');

  const requirements = await readTextFile(ctx.requirementsPath);
  const spec = await readTextFile(ctx.specPath);
  const taskIndex = splitRequirementsIntoTasks({ requirements, spec });

  printInfo(`共拆分出 ${taskIndex.tasks.length} 个任务：`);
  printTable(taskIndex.tasks);

  const { approved } = await requestApproval('请审阅以上任务列表。', { content: requirements });

  if (!approved) {
    printError('任务列表未通过审批，请重新运行 task 命令。');
    process.exitCode = 1;
    return;
  }

  // 写入 task index
  await writeJsonFile(ctx.taskIndexPath, taskIndex);

  // 为每个任务生成独立的 markdown 文件
  const sections = requirements.split(/(?=^## )/m).filter((s) => s.trim());
  for (let i = 0; i < taskIndex.tasks.length; i++) {
    const task = taskIndex.tasks[i];
    const body = sections[i] ?? '';
    const md = generateTaskMarkdown(task, body.replace(/^## .+\n?/, '').trim());
    await writeTextFile(join(ctx.tasksDir, `${task.id}.md`), md);
  }

  const updatedConfig = { ...config, currentPhase: 'task' as const };
  await saveConfig(ctx, updatedConfig);

  printSuccess(`${taskIndex.tasks.length} 个任务已保存到 ${ctx.tasksDir}/`);
}
