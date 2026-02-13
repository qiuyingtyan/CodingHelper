import chalk from 'chalk';
import type { TaskItem } from '../types/index.js';

export function printSuccess(msg: string): void {
  console.log(chalk.green(`✓ ${msg}`));
}

export function printError(msg: string): void {
  console.error(chalk.red(`✗ ${msg}`));
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow(`! ${msg}`));
}

export function printInfo(msg: string): void {
  console.log(chalk.cyan(`i ${msg}`));
}

export function printPhaseHeader(phase: string, title: string): void {
  console.log('');
  console.log(chalk.bold.underline(`[${phase.toUpperCase()}] ${title}`));
  console.log('');
}

export function printTable(tasks: readonly TaskItem[]): void {
  const statusColors: Record<string, (s: string) => string> = {
    pending: chalk.gray,
    in_progress: chalk.yellow,
    completed: chalk.green,
    rejected: chalk.red,
  };

  const header = `${'ID'.padEnd(12)} ${'Title'.padEnd(30)} ${'Status'.padEnd(14)} ${'Priority'}`;
  console.log(chalk.bold(header));
  console.log('-'.repeat(70));

  for (const t of tasks) {
    const colorFn = statusColors[t.status] ?? chalk.white;
    const line = `${t.id.padEnd(12)} ${t.title.padEnd(30)} ${colorFn(t.status.padEnd(14))} ${String(t.priority)}`;
    console.log(line);
  }
}
