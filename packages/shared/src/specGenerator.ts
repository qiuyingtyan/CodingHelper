import type { Config } from './types.js';
import { resolveSpecStrategy } from './specStrategies.js';

export interface SpecInput {
  config: Config;
  requirements: string;
}

export function generateSpecDoc(input: SpecInput): string {
  const { config } = input;
  const { projectName, techStack } = config;
  const strategy = resolveSpecStrategy(techStack);

  const techDesc = [
    techStack.frontend ? ` ${techStack.frontend} 前端` : '',
    techStack.backend ? ` + ${techStack.backend} 后端` : '',
    techStack.database ? ` + ${techStack.database} 数据库` : '',
  ].filter(Boolean).join('');

  const lines: string[] = [
    `# ${projectName} — 技术规范`,
    '',
    `> 自动生成于 ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## 架构概述',
    '',
    `本项目采用${techDesc || '自定义'}架构。`,
    '',
    '## 目录结构规范',
    '',
    '```',
    strategy.directoryStructure,
    '```',
    '',
    '## 编码规范',
    '',
    ...strategy.codingStandards,
    '',
    '## 错误处理策略',
    '',
    ...strategy.errorHandling,
    '',
    '## 测试策略',
    '',
    ...strategy.testStrategy,
    '',
  ];

  return lines.join('\n');
}

export function generateClaudeMd(input: SpecInput): string {
  const { config, requirements } = input;
  const { projectName, techStack } = config;
  const strategy = resolveSpecStrategy(techStack);

  const techLines = [
    techStack.frontend ? `- 前端：${techStack.frontend}` : '',
    techStack.backend ? `- 后端：${techStack.backend}` : '',
    techStack.database ? `- 数据库：${techStack.database}` : '',
  ].filter(Boolean);

  const lines: string[] = [
    `# CLAUDE.md — ${projectName}`,
    '',
    '## 项目约束',
    '',
    `- 项目名称：${projectName}`,
    `- 描述：${config.description}`,
    ...techLines,
    '',
    '## 编码规范',
    '',
    ...strategy.codingStandards,
    '',
    '## 错误处理',
    '',
    ...strategy.errorHandling,
    '',
    '## 测试要求',
    '',
    ...strategy.testStrategy,
    '',
    '## 当前需求',
    '',
    requirements,
    '',
  ];

  return lines.join('\n');
}
