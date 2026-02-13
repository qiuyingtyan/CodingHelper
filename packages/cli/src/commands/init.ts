import { input, search, confirm } from '@inquirer/prompts';
import type { Config } from '../types/index.js';
import {
  buildProjectContext,
  saveConfig,
} from '../utils/projectContext.js';
import { ensureDir, fileExists } from '../utils/fs.js';
import { printSuccess, printError, printPhaseHeader, printInfo } from '../utils/display.js';
import {
  createSuggestionProvider,
  type TechCategory,
  type TechSuggestion,
} from '../core/suggestionEngine.js';

const SKIP_VALUE = '__skip__';

function buildSearchSource(suggestions: readonly TechSuggestion[]) {
  const choices = [
    { name: '跳过', value: SKIP_VALUE, description: '不选择此类技术栈' },
    ...suggestions.map((s) => ({
      name: s.name,
      value: s.name,
      description: s.description,
    })),
  ];
  return (term: string | undefined) => {
    if (!term) return choices;
    const lower = term.toLowerCase();
    return choices.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower),
    );
  };
}

async function pickTech(
  category: TechCategory,
  label: string,
): Promise<string> {
  const provider = createSuggestionProvider();
  const suggestions = provider.suggestTechStack(category);

  const chosen = await search({
    message: `${label}（输入搜索或选择）：`,
    source: buildSearchSource(suggestions),
  });

  if (chosen === SKIP_VALUE) return '';

  // Show companion recommendations
  const companions = provider.suggestCompanions(category, chosen);
  if (companions.length > 0) {
    const extras: string[] = [];
    for (const group of companions) {
      const pick = await search({
        message: `推荐搭配 ${chosen} 的${group.group}：`,
        source: buildSearchSource(group.options),
      });
      if (pick !== SKIP_VALUE) extras.push(pick);
    }
    return extras.length > 0 ? `${chosen}, ${extras.join(', ')}` : chosen;
  }

  return chosen;
}

export async function runInit(): Promise<void> {
  printPhaseHeader('init', '初始化项目');

  const cwd = process.cwd();
  const ctx = buildProjectContext(cwd);

  if (await fileExists(ctx.configPath)) {
    printError('项目已初始化。如需重新初始化，请先删除 .codinghelper/ 目录。');
    process.exitCode = 1;
    return;
  }

  const projectName = await input({
    message: '项目名称：',
    default: cwd.split(/[\\/]/).pop() ?? 'my-project',
    validate: (v) => (v.trim().length > 0 ? true : '项目名称不能为空'),
  });

  const description = await input({
    message: '项目描述：',
    default: '',
  });

  printInfo('选择技术栈（支持搜索，可跳过）');

  const frontend = await pickTech('frontend', '前端框架');
  const backend = await pickTech('backend', '后端框架');
  const database = await pickTech('database', '数据库');

  const config: Config = {
    projectName: projectName.trim(),
    description: description.trim(),
    techStack: {
      ...(frontend ? { frontend } : {}),
      ...(backend ? { backend } : {}),
      ...(database ? { database } : {}),
    },
    createdAt: new Date().toISOString(),
    currentPhase: 'init',
    version: '1.0.0',
  };

  await ensureDir(ctx.helperDir);
  await ensureDir(ctx.tasksDir);
  await saveConfig(ctx, config);

  printSuccess(`项目 "${config.projectName}" 初始化完成！`);
  printSuccess(`配置已保存到 ${ctx.configPath}`);

  if (frontend || backend || database) {
    printInfo('技术栈：');
    if (frontend) printInfo(`  前端：${frontend}`);
    if (backend) printInfo(`  后端：${backend}`);
    if (database) printInfo(`  数据库：${database}`);
  }
}
