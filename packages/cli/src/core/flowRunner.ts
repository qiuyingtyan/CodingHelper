import { confirm } from '@inquirer/prompts';
import { printProgress, printInfo } from '../utils/display.js';
import type { Phase } from '../types/index.js';

interface FlowStep {
  readonly next: string;
  readonly label: string;
}

const FLOW_MAP: Record<string, FlowStep> = {
  init: { next: 'plan', label: '需求分析' },
  plan: { next: 'spec', label: '技术规范' },
  spec: { next: 'task', label: '任务拆分' },
  task: { next: 'run', label: '执行任务' },
};

const COMMAND_PHASE: Record<string, Phase> = {
  init: 'init',
  plan: 'plan',
  spec: 'spec',
  task: 'task',
  run: 'run',
  done: 'run',
};

async function executeCommand(command: string): Promise<void> {
  switch (command) {
    case 'plan': {
      const { runPlan } = await import('../commands/plan.js');
      await runPlan();
      break;
    }
    case 'spec': {
      const { runSpec } = await import('../commands/spec.js');
      await runSpec();
      break;
    }
    case 'task': {
      const { runTask } = await import('../commands/task.js');
      await runTask();
      break;
    }
    case 'run': {
      const { runRun } = await import('../commands/run.js');
      await runRun();
      break;
    }
    case 'review': {
      const { runReview } = await import('../commands/review.js');
      await runReview({});
      break;
    }
    default:
      break;
  }
}

async function getDoneNextStep(): Promise<FlowStep | null> {
  try {
    const { resolveProjectContext } = await import('../utils/projectContext.js');
    const { readJsonFile } = await import('../utils/fs.js');
    const { TaskIndexSchema } = await import('../types/index.js');
    const ctx = await resolveProjectContext();
    const taskIndex = await readJsonFile(ctx.taskIndexPath, TaskIndexSchema);
    const remaining = taskIndex.tasks.filter((t) => t.status === 'pending');
    if (remaining.length > 0) {
      return { next: 'run', label: `执行下一个任务（剩余 ${remaining.length} 个）` };
    }
    return { next: 'review', label: '任务审查' };
  } catch {
    return null;
  }
}

export async function promptAdvance(completedCommand: string): Promise<void> {
  const phase = COMMAND_PHASE[completedCommand];
  if (phase) {
    printProgress(phase);
  }

  let step: FlowStep | null = null;

  if (completedCommand === 'done') {
    step = await getDoneNextStep();
  } else {
    step = FLOW_MAP[completedCommand] ?? null;
  }

  if (!step) return;

  // run 是自然停止点，不自动推进
  if (completedCommand === 'run') return;

  const shouldContinue = await confirm({
    message: `是否继续下一步 [${step.label}]？`,
    default: true,
  });

  if (!shouldContinue) {
    printInfo(`下一步请运行：codinghelper ${step.next}`);
    return;
  }

  await executeCommand(step.next);

  // 递归推进（run 命令执行后会自然停止）
  if (process.exitCode !== 1) {
    await promptAdvance(step.next);
  }
}
