import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { readTextFile, writeTextFile } from '../utils/fs.js';
import { generateSpecDoc, generateClaudeMd } from '../core/specGenerator.js';
import { requestApproval } from '../core/approvalManager.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printError, printPhaseHeader, printInfo } from '../utils/display.js';

export async function runSpec(): Promise<void> {
  printPhaseHeader('spec', '技术规范生成');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'plan');

  const requirements = await readTextFile(ctx.requirementsPath);
  const specDoc = generateSpecDoc({ config, requirements });
  const claudeMd = generateClaudeMd({ config, requirements });

  printInfo('--- 技术规范预览 ---');
  console.log(specDoc);
  printInfo('--- 预览结束 ---');

  const { approved } = await requestApproval('请审阅以上技术规范。', { content: specDoc });

  if (!approved) {
    printError('技术规范未通过审批，请重新运行 spec 命令。');
    process.exitCode = 1;
    return;
  }

  await writeTextFile(ctx.specPath, specDoc);
  await writeTextFile(ctx.claudeMdPath, claudeMd);
  const updatedConfig = { ...config, currentPhase: 'spec' as const };
  await saveConfig(ctx, updatedConfig);

  printSuccess(`技术规范已保存到 ${ctx.specPath}`);
  printSuccess(`CLAUDE.md 已生成到 ${ctx.claudeMdPath}`);
}
