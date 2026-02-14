import type { Config, TechStack } from './types.js';

export interface PlannerInput {
  requirements: string;
  config: Config;
}

export interface PlannerOutput {
  requirementsDoc: string;
}

export function generateRequirementsDoc(input: PlannerInput): string {
  const { requirements, config } = input;
  const { projectName, techStack } = config;

  const lines: string[] = [
    `# ${projectName} — 需求文档`,
    '',
    `> 自动生成于 ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## 项目概述',
    '',
    config.description || '_（未填写）_',
    '',
    '## 技术栈',
    '',
    formatTechStack(techStack),
    '',
    '## 功能需求',
    '',
    requirements,
    '',
    '## 非功能需求',
    '',
    '- 代码需通过 TypeScript 严格模式编译',
    '- 测试覆盖率 ≥ 80%',
    '- 遵循项目编码规范',
    '',
  ];

  return lines.join('\n');
}

function formatTechStack(ts: TechStack): string {
  const entries: string[] = [];
  if (ts.frontend) entries.push(`- 前端：${ts.frontend}`);
  if (ts.backend) entries.push(`- 后端：${ts.backend}`);
  if (ts.database) entries.push(`- 数据库：${ts.database}`);
  return entries.length > 0 ? entries.join('\n') : '_（未指定）_';
}
