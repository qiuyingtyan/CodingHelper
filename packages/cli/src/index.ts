import { Command } from 'commander';
import { runInit } from './commands/init.js';
import type { InitOptions } from './commands/init.js';
import { runPlan } from './commands/plan.js';
import { runSpec } from './commands/spec.js';
import type { SpecOptions } from './commands/spec.js';
import { runTask } from './commands/task.js';
import { runRun, runDone, runStatus } from './commands/run.js';
import type { RunOptions } from './commands/run.js';
import { runDebug } from './commands/debug.js';
import type { DebugOptions } from './commands/debug.js';
import { runReview } from './commands/review.js';
import type { ReviewOptions } from './commands/review.js';
import { runDashboard } from './commands/dashboard.js';
import type { DashboardOptions } from './commands/dashboard.js';
import { runCompact } from './commands/compact.js';
import type { CompactOptions } from './commands/compact.js';
import { printError, printWarning } from './utils/display.js';
import { DomainError } from './errors/domainErrors.js';

const program = new Command();

program
  .name('codinghelper')
  .description('AI 辅助编程工作流 CLI — 从需求到代码的结构化流程')
  .version('0.1.0');

program
  .command('init')
  .description('初始化项目，创建 .codinghelper/ 配置目录')
  .option('-t, --template <name>', '使用预设模板快速初始化（如 vue-express, react-nestjs）')
  .action(wrapAction((opts: InitOptions) => runInit(opts)));

program
  .command('plan')
  .description('需求分析，生成需求文档')
  .action(wrapAction(runPlan));

program
  .command('spec')
  .description('生成技术规范和 CLAUDE.md')
  .option('--regenerate', '强制重新生成技术规范（覆盖已有文件）')
  .action(wrapAction((opts: SpecOptions) => runSpec(opts)));

program
  .command('task')
  .description('将需求拆分为可执行的任务列表')
  .action(wrapAction(runTask));

program
  .command('run')
  .description('执行下一个待处理任务')
  .option('--resume', '恢复上次中断的 in_progress 任务')
  .option('--dry-run', '仅预览下一个任务，不修改状态')
  .option('--all', '配合 --dry-run 展示所有待执行任务')
  .action(wrapAction((opts: RunOptions) => runRun(opts)));

program
  .command('done')
  .description('标记当前任务为已完成')
  .action(wrapAction(runDone));

program
  .command('status')
  .description('查看项目状态和任务进度')
  .action(wrapAction(runStatus));

program
  .command('debug')
  .description('进入调试模式，生成调试指令并注入 CLAUDE.md')
  .option('-s, --scope <scope>', '调试范围：front, back, db, all', 'all')
  .option('-e, --error <message>', '错误日志或错误信息')
  .action(wrapAction((opts: DebugOptions) => runDebug(opts)));

program
  .command('review')
  .description('审查任务，支持 approve/reject 快捷标记')
  .option('-a, --approve', '标记任务审查通过')
  .option('-r, --reject', '驳回任务')
  .option('-c, --comment <comment>', '审查备注')
  .option('-t, --task <taskId>', '指定要审查的任务 ID')
  .action(wrapAction((opts: ReviewOptions) => runReview(opts)));

program
  .command('dashboard')
  .description('启动 Web Dashboard 可视化面板')
  .option('-p, --port <port>', '服务器端口号', '3120')
  .action(wrapAction((opts: DashboardOptions) => runDashboard(opts)));

program
  .command('compact')
  .description('压缩历史记录和日志，释放上下文空间')
  .option('-k, --keep <count>', '保留最近 N 条历史记录', '50')
  .option('-d, --days <days>', '归档超过 N 天的日志文件', '30')
  .action(wrapAction((opts: CompactOptions) => runCompact(opts)));

function wrapAction<T = void>(fn: (opts: T) => Promise<void>): (opts: T) => Promise<void> {
  return async (opts: T) => {
    try {
      await fn(opts);
    } catch (err) {
      if (err instanceof DomainError) {
        printWarning(err.message);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        printError(message);
      }
      process.exitCode = 1;
    }
  };
}

program.parse();
