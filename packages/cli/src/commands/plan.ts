import { editor, confirm } from '@inquirer/prompts';
import {
  resolveProjectContext,
  loadConfig,
  saveConfig,
} from '../utils/projectContext.js';
import { writeTextFile } from '../utils/fs.js';
import { generateRequirementsDoc } from '../core/planner.js';
import { requestApproval } from '../core/approvalManager.js';
import { assertMinPhase } from '../utils/phaseGuard.js';
import { printSuccess, printError, printPhaseHeader, printInfo, printWarning } from '../utils/display.js';
import {
  createSuggestionProvider,
  REQUIREMENT_CATEGORIES,
  type RequirementSection,
} from '../core/suggestionEngine.js';

export async function runPlan(): Promise<void> {
  printPhaseHeader('plan', '需求分析');

  const ctx = await resolveProjectContext();
  const config = await loadConfig(ctx);
  assertMinPhase(config.currentPhase, 'init');

  const provider = createSuggestionProvider();
  const sections: RequirementSection[] = [];

  printInfo('按分类填写需求，每项会打开编辑器。留空可跳过非必填项。');

  for (const cat of REQUIREMENT_CATEGORIES) {
    const tag = cat.required ? '（必填）' : '（可选）';
    const content = await editor({
      message: `${cat.label}${tag} — ${cat.hint}`,
      default: '',
      postfix: '.md',
    });
    const trimmed = content.trim();
    if (cat.required && trimmed.length === 0) {
      printError(`「${cat.label}」为必填项，请输入内容。`);
      process.exitCode = 1;
      return;
    }
    sections.push({ category: cat.key, content: trimmed });
  }

  // Completeness analysis
  const report = provider.analyzeRequirements(sections);
  printInfo(`需求完整度：${report.score}%`);
  if (report.filled.length > 0) {
    printSuccess(`已填写：${report.filled.join('、')}`);
  }
  if (report.missing.length > 0) {
    printWarning(`未填写：${report.missing.join('、')}`);
    for (const s of report.suggestions) {
      printInfo(`  → ${s}`);
    }

    if (report.score < 40) {
      const cont = await confirm({
        message: '完整度较低，是否继续生成需求文档？',
        default: false,
      });
      if (!cont) {
        printInfo('已取消，请重新运行 plan 命令补充需求。');
        return;
      }
    }
  }

  // Merge sections into single requirements string
  const merged = sections
    .filter((s) => s.content.length > 0)
    .map((s) => {
      const label = REQUIREMENT_CATEGORIES.find((c) => c.key === s.category)?.label ?? s.category;
      return `## ${label}\n\n${s.content}`;
    })
    .join('\n\n');

  const doc = generateRequirementsDoc({ requirements: merged, config });

  printInfo('--- 需求文档预览 ---');
  console.log(doc);
  printInfo('--- 预览结束 ---');

  const { approved } = await requestApproval('请审阅以上需求文档。', { content: doc });

  if (!approved) {
    printError('需求文档未通过审批，请重新运行 plan 命令。');
    process.exitCode = 1;
    return;
  }

  await writeTextFile(ctx.requirementsPath, doc);
  const updatedConfig = { ...config, currentPhase: 'plan' as const };
  await saveConfig(ctx, updatedConfig);

  printSuccess(`需求文档已保存到 ${ctx.requirementsPath}`);
}
