import { resolve } from 'node:path';
import { createServer } from '@codinghelper/server';
import { printSuccess, printInfo, printError } from '../utils/display.js';

export interface DashboardOptions {
  port?: string;
}

export async function runDashboard(opts: DashboardOptions): Promise<void> {
  const rootDir = process.cwd();
  const port = opts.port ? parseInt(opts.port, 10) : 3120;

  if (isNaN(port)) {
    printError('端口号无效');
    return;
  }

  // Resolve dashboard dist directory
  const staticDir = resolve(
    import.meta.dirname ?? new URL('.', import.meta.url).pathname,
    '..', '..', '..', 'dashboard', 'dist',
  );

  const server = createServer({ rootDir, port, staticDir });

  printInfo(`启动 Dashboard 服务器...`);
  await server.start();
  printSuccess(`Dashboard 已启动: http://localhost:${port}`);
  printInfo('按 Ctrl+C 停止服务器');
}
