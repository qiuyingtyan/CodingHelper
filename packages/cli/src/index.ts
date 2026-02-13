import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runPlan } from './commands/plan.js';
import { runSpec } from './commands/spec.js';
import { runTask } from './commands/task.js';
import { runRun, runDone, runStatus } from './commands/run.js';
import { printError } from './utils/display.js';

const program = new Command();

program
  .name('codinghelper')
  .description('AI 辅助编程工作流 CLI — 从需求到代码的结构化流程')
  .version('0.1.0');

program
  .command('init')
  .description('初始化项目，创建 .codinghelper/ 配置目录')
  .action(wrapAction(runInit));

program
  .command('plan')
  .description('需求分析，生成需求文档')
  .action(wrapAction(runPlan));

program
  .command('spec')
  .description('生成技术规范和 CLAUDE.md')
  .action(wrapAction(runSpec));

program
  .command('task')
  .description('将需求拆分为可执行的任务列表')
  .action(wrapAction(runTask));

program
  .command('run')
  .description('执行下一个待处理任务')
  .action(wrapAction(runRun));

program
  .command('done')
  .description('标记当前任务为已完成')
  .action(wrapAction(runDone));

program
  .command('status')
  .description('查看项目状态和任务进度')
  .action(wrapAction(runStatus));

function wrapAction(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      printError(message);
      process.exitCode = 1;
    }
  };
}

program.parse();
