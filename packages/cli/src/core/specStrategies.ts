import type { TechStack } from '../types/index.js';

export interface SpecStrategy {
  readonly directoryStructure: string;
  readonly codingStandards: string[];
  readonly errorHandling: string[];
  readonly testStrategy: string[];
}

function detectFramework(techStack: TechStack): string | null {
  const all = [
    techStack.frontend ?? '',
    techStack.backend ?? '',
  ].join(' ').toLowerCase();

  if (all.includes('react') || all.includes('next')) return 'react';
  if (all.includes('vue') || all.includes('nuxt')) return 'vue';
  if (all.includes('nestjs')) return 'nestjs';
  if (all.includes('express') || all.includes('fastify') || all.includes('koa') || all.includes('hono')) return 'express';
  return null;
}

const REACT_STRATEGY: SpecStrategy = {
  directoryStructure: [
    'src/',
    '├── components/       # React 组件',
    '├── hooks/            # 自定义 Hooks',
    '├── pages/            # 页面组件',
    '├── services/         # API 调用层',
    '├── stores/           # 状态管理',
    '├── types/            # 类型定义',
    '├── utils/            # 工具函数',
    '└── __tests__/        # 测试文件',
  ].join('\n'),
  codingStandards: [
    '- 使用 TypeScript 严格模式',
    '- 组件使用函数式组件 + Hooks',
    '- 文件命名：组件 PascalCase，其余 camelCase',
    '- 常量命名：UPPER_SNAKE_CASE',
    '- 使用 React.memo / useMemo / useCallback 优化性能',
    '- Props 接口以 Props 后缀命名（如 ButtonProps）',
  ],
  errorHandling: [
    '- 使用 ErrorBoundary 捕获组件渲染错误',
    '- API 调用统一 try/catch，返回 Result 类型',
    '- 表单验证使用 Zod schema',
    '- 用户友好的错误提示（Toast / Alert）',
  ],
  testStrategy: [
    '- 单元测试：Vitest + React Testing Library',
    '- 组件测试覆盖用户交互和渲染逻辑',
    '- Hook 测试使用 renderHook',
    '- 覆盖率目标：≥ 80%',
    '- 测试文件与源文件同目录 `__tests__/`',
  ],
};
const VUE_STRATEGY: SpecStrategy = {
  directoryStructure: [
    'src/',
    '├── components/       # Vue 组件',
    '├── composables/      # 组合式函数',
    '├── views/            # 页面视图',
    '├── services/         # API 调用层',
    '├── stores/           # Pinia 状态管理',
    '├── types/            # 类型定义',
    '├── utils/            # 工具函数',
    '└── __tests__/        # 测试文件',
  ].join('\n'),
  codingStandards: [
    '- 使用 TypeScript 严格模式',
    '- 组件使用 `<script setup lang="ts">` 语法',
    '- 文件命名：组件 PascalCase，其余 camelCase',
    '- 常量命名：UPPER_SNAKE_CASE',
    '- 组合式函数以 use 前缀命名（如 useAuth）',
    '- Props 使用 defineProps 配合 TypeScript 类型',
  ],
  errorHandling: [
    '- 全局错误处理：app.config.errorHandler',
    '- API 调用统一 try/catch，返回 Result 类型',
    '- 表单验证使用 Zod schema',
    '- 用户友好的错误提示（Message / Notification）',
  ],
  testStrategy: [
    '- 单元测试：Vitest + Vue Test Utils',
    '- 组件测试覆盖用户交互和渲染逻辑',
    '- Composable 测试使用独立测试函数',
    '- 覆盖率目标：≥ 80%',
    '- 测试文件与源文件同目录 `__tests__/`',
  ],
};

const EXPRESS_STRATEGY: SpecStrategy = {
  directoryStructure: [
    'src/',
    '├── routes/           # 路由定义',
    '├── controllers/      # 请求处理器',
    '├── services/         # 业务逻辑',
    '├── middleware/        # 中间件',
    '├── models/           # 数据模型',
    '├── types/            # 类型定义',
    '├── utils/            # 工具函数',
    '└── __tests__/        # 测试文件',
  ].join('\n'),
  codingStandards: [
    '- 使用 TypeScript 严格模式',
    '- 文件命名：camelCase',
    '- 常量命名：UPPER_SNAKE_CASE',
    '- 路由与业务逻辑分离（Controller → Service 模式）',
    '- 请求/响应类型使用 Zod schema 验证',
    '- 每个公开函数需有 JSDoc 注释',
  ],
  errorHandling: [
    '- 使用自定义 AppError 类（含 statusCode）',
    '- 全局错误处理中间件统一捕获',
    '- 异步路由使用 asyncHandler 包装',
    '- 输入验证失败返回 400，业务错误返回对应状态码',
  ],
  testStrategy: [
    '- 单元测试：Vitest',
    '- API 集成测试：supertest',
    '- 覆盖率目标：≥ 80%',
    '- 测试文件与源文件同目录 `__tests__/`',
  ],
};

const NESTJS_STRATEGY: SpecStrategy = {
  directoryStructure: [
    'src/',
    '├── modules/          # 功能模块（含 controller/service/dto）',
    '├── common/           # 共享装饰器、管道、守卫',
    '├── config/           # 配置模块',
    '├── types/            # 全局类型定义',
    '└── main.ts           # 应用入口',
  ].join('\n'),
  codingStandards: [
    '- 使用 TypeScript 严格模式',
    '- 遵循 NestJS 模块化架构（Module → Controller → Service）',
    '- DTO 使用 class-validator 装饰器验证',
    '- 文件命名：kebab-case（NestJS 约定）',
    '- 依赖注入优先，避免直接实例化',
  ],
  errorHandling: [
    '- 使用 NestJS 内置异常过滤器',
    '- 自定义 HttpException 子类处理业务错误',
    '- 全局 ExceptionFilter 统一错误响应格式',
    '- 使用 ValidationPipe 自动验证 DTO',
  ],
  testStrategy: [
    '- 单元测试：Jest（NestJS 默认）',
    '- 使用 Test.createTestingModule 构建测试模块',
    '- E2E 测试：supertest',
    '- 覆盖率目标：≥ 80%',
  ],
};

const DEFAULT_STRATEGY: SpecStrategy = {
  directoryStructure: [
    'src/',
    '├── components/       # UI 组件',
    '├── services/         # 业务逻辑',
    '├── utils/            # 工具函数',
    '├── types/            # 类型定义',
    '└── __tests__/        # 测试文件',
  ].join('\n'),
  codingStandards: [
    '- 使用 TypeScript 严格模式',
    '- 文件命名：camelCase',
    '- 组件命名：PascalCase',
    '- 常量命名：UPPER_SNAKE_CASE',
    '- 每个函数需有 JSDoc 注释',
  ],
  errorHandling: [
    '- 使用自定义 Error 类',
    '- 异步操作统一 try/catch',
    '- 用户友好的错误提示',
  ],
  testStrategy: [
    '- 单元测试：Vitest',
    '- 覆盖率目标：≥ 80%',
    '- 测试文件与源文件同目录 `__tests__/`',
  ],
};

const STRATEGY_MAP: Record<string, SpecStrategy> = {
  react: REACT_STRATEGY,
  vue: VUE_STRATEGY,
  express: EXPRESS_STRATEGY,
  nestjs: NESTJS_STRATEGY,
};

export function resolveSpecStrategy(techStack: TechStack): SpecStrategy {
  const framework = detectFramework(techStack);
  if (framework && STRATEGY_MAP[framework]) {
    return STRATEGY_MAP[framework];
  }
  return DEFAULT_STRATEGY;
}
