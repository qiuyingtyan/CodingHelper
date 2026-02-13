import type { Config } from '../types/index.js';

export interface SpecInput {
  config: Config;
  requirements: string;
}

export function generateSpecDoc(input: SpecInput): string {
  const { config, requirements } = input;
  const { projectName, techStack } = config;

  const lines: string[] = [
    `# ${projectName} — 技术规范`,
    '',
    `> 自动生成于 ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## 架构概述',
    '',
    `本项目采用${techStack.frontend ? ` ${techStack.frontend} 前端` : ''}${techStack.backend ? ` + ${techStack.backend} 后端` : ''}${techStack.database ? ` + ${techStack.database} 数据库` : ''}架构。`,
    '',
    '## 目录结构规范',
    '',
    '```',
    'src/',
    '├── components/     # UI 组件',
    '├── services/       # 业务逻辑',
    '├── utils/          # 工具函数',
    '├── types/          # 类型定义',
    '└── __tests__/      # 测试文件',
    '```',
    '',
    '## 编码规范',
    '',
    '- 使用 TypeScript 严格模式',
    '- 文件命名：camelCase',
    '- 组件命名：PascalCase',
    '- 常量命名：UPPER_SNAKE_CASE',
    '- 每个函数需有 JSDoc 注释',
    '',
    '## 错误处理策略',
    '',
    '- 使用自定义 Error 类',
    '- 异步操作统一 try/catch',
    '- 用户友好的错误提示',
    '',
    '## 测试策略',
    '',
    '- 单元测试：Vitest',
    '- 覆盖率目标：≥ 80%',
    '- 测试文件与源文件同目录 `__tests__/`',
    '',
  ];

  return lines.join('\n');
}

export function generateClaudeMd(input: SpecInput): string {
  const { config, requirements } = input;
  const { projectName, techStack } = config;

  const lines: string[] = [
    `# CLAUDE.md — ${projectName}`,
    '',
    '## 项目约束',
    '',
    `- 项目名称：${projectName}`,
    `- 描述：${config.description}`,
    techStack.frontend ? `- 前端：${techStack.frontend}` : '',
    techStack.backend ? `- 后端：${techStack.backend}` : '',
    techStack.database ? `- 数据库：${techStack.database}` : '',
    '',
    '## 编码规范',
    '',
    '- TypeScript 严格模式',
    '- ESM 模块系统',
    '- 文件命名 camelCase，组件 PascalCase',
    '- 每个公开函数需有 JSDoc',
    '',
    '## 测试要求',
    '',
    '- 使用 Vitest',
    '- 覆盖率 ≥ 80%',
    '- 测试文件放在 `__tests__/` 目录',
    '',
    '## 当前需求',
    '',
    requirements,
    '',
  ];

  return lines.filter((l) => l !== undefined).join('\n');
}
