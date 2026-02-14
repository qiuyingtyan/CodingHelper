import { describe, it, expect, vi, beforeEach } from 'vitest';
import chalk from 'chalk';
import { printSuccess, printError, printWarning, printInfo, printPhaseHeader, printTable } from '../display.js';
import type { TaskItem } from '../../types/index.js';

describe('display', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('printSuccess outputs green message', () => {
    printSuccess('done');
    expect(logSpy).toHaveBeenCalledWith(chalk.green('✓ done'));
  });

  it('printError outputs red message to stderr', () => {
    printError('fail');
    expect(errorSpy).toHaveBeenCalledWith(chalk.red('✗ fail'));
  });

  it('printWarning outputs yellow message', () => {
    printWarning('warn');
    expect(logSpy).toHaveBeenCalledWith(chalk.yellow('! warn'));
  });

  it('printInfo outputs cyan message', () => {
    printInfo('info');
    expect(logSpy).toHaveBeenCalledWith(chalk.cyan('i info'));
  });

  it('printPhaseHeader outputs bold underlined header', () => {
    printPhaseHeader('init', '初始化');
    expect(logSpy).toHaveBeenCalledWith(chalk.bold.underline('[INIT] 初始化'));
  });

  it('printTable outputs formatted task list', () => {
    const tasks: TaskItem[] = [
      { id: 'task-001', title: '登录', status: 'pending', dependencies: [], priority: 1, createdAt: '2025-01-01T00:00:00Z', completedAt: null },
      { id: 'task-002', title: '注册', status: 'completed', dependencies: [], priority: 2, createdAt: '2025-01-01T00:00:00Z', completedAt: '2025-01-02T00:00:00Z' },
    ];
    printTable(tasks);
    // header + separator + 2 rows = at least 4 calls (plus empty lines)
    expect(logSpy).toHaveBeenCalledTimes(4);
  });

  it('printTable handles empty task list', () => {
    printTable([]);
    // header + separator only
    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});
