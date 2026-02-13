import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { writeJsonFile } from '../utils/fs.js';
import { DebugScopeSchema } from '../types/index.js';
import type { DebugScope } from '../types/index.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { generateDebugInstructions } from '../core/debugOrchestrator.js';
import { injectDebugContext } from '../core/claudeMdManager.js';
import { printSuccess, printInfo, printPhaseHeader, printWarning } from '../utils/display.js';
import { join } from 'node:path';

export interface DebugOptions {
  scope?: string;
  error?: string;
}

export async function runDebug(options: DebugOptions): Promise<void> {
  printPhaseHeader('debug', '调试分析');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'run');

  // 解析 scope，默认 all
  const scopeResult = DebugScopeSchema.safeParse(options.scope ?? 'all');
  if (!scopeResult.success) {
    printWarning(`无效的 scope "${options.scope}"，可选值：front, back, db, all。使用默认值 all。`);
  }
  const scope: DebugScope = scopeResult.success ? scopeResult.data : 'all';

  const debugLog = generateDebugInstructions({
    config,
    scope,
    errorLog: options.error,
  });

  // 保存 debug 日志到 logs 目录
  const logFileName = `debug-${Date.now()}.json`;
  const logPath = join(ctx.logsDir, logFileName);
  await writeJsonFile(logPath, debugLog);
  printInfo(`Debug 日志已保存：${logPath}`);

  // 注入到 CLAUDE.md
  await injectDebugContext(ctx, debugLog.claudeMdInstructions);
  printSuccess('Debug 上下文已注入 CLAUDE.md，请将项目交给 Claude Code 进行调试。');

  // 更新阶段
  const updatedConfig = { ...config, currentPhase: 'debug' as const };
  await saveConfig(ctx, updatedConfig);

  // 输出摘要
  printInfo(`范围：${scope}`);
  printInfo(`发现 ${debugLog.findings.length} 项分析结果`);
  console.log('');
  console.log(debugLog.claudeMdInstructions);
}
