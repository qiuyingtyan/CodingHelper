// --- Types ---

export type TechCategory = 'frontend' | 'backend' | 'database';

export interface TechSuggestion {
  readonly name: string;
  readonly description: string;
}

export interface CompanionSuggestion {
  readonly group: string;
  readonly options: readonly TechSuggestion[];
}

export interface RequirementSection {
  readonly category: string;
  readonly content: string;
}

export interface CompletenessReport {
  readonly score: number;
  readonly filled: readonly string[];
  readonly missing: readonly string[];
  readonly suggestions: readonly string[];
}

export interface SuggestionProvider {
  suggestTechStack(category: TechCategory): TechSuggestion[];
  suggestCompanions(category: TechCategory, chosen: string): CompanionSuggestion[];
  analyzeRequirements(sections: RequirementSection[]): CompletenessReport;
  suggestImprovements(content: string, feedback: string): string[];
}

// --- Preset Data ---

export const TECH_PRESETS: Record<TechCategory, TechSuggestion[]> = {
  frontend: [
    { name: 'React', description: '组件化 UI 库，生态丰富' },
    { name: 'Vue 3', description: '渐进式框架，易上手' },
    { name: 'Next.js', description: 'React 全栈框架，支持 SSR/SSG' },
    { name: 'Svelte', description: '编译时框架，零运行时开销' },
    { name: 'Angular', description: '企业级全功能框架' },
    { name: 'Nuxt 3', description: 'Vue 全栈框架，支持 SSR/SSG' },
    { name: 'Solid.js', description: '高性能响应式 UI 库' },
  ],
  backend: [
    { name: 'Express', description: '轻量 Node.js Web 框架' },
    { name: 'Fastify', description: '高性能 Node.js 框架' },
    { name: 'NestJS', description: 'Node.js 企业级框架，类 Angular 架构' },
    { name: 'Spring Boot', description: 'Java 企业级框架' },
    { name: 'FastAPI', description: 'Python 高性能异步框架' },
    { name: 'Hono', description: '超轻量 Edge 优先 Web 框架' },
    { name: 'Koa', description: '精简的 Node.js 中间件框架' },
  ],
  database: [
    { name: 'PostgreSQL', description: '功能强大的关系型数据库' },
    { name: 'MySQL', description: '流行的关系型数据库' },
    { name: 'MongoDB', description: '文档型 NoSQL 数据库' },
    { name: 'Redis', description: '内存键值存储，适合缓存' },
    { name: 'SQLite', description: '嵌入式关系型数据库，零配置' },
  ],
};

type CompanionEntry = Record<string, CompanionSuggestion[]>;

const COMPANION_MAP: Record<TechCategory, CompanionEntry> = {
  frontend: {
    React: [
      { group: '状态管理', options: [
        { name: 'Zustand', description: '轻量状态管理' },
        { name: 'Redux Toolkit', description: '成熟的状态管理方案' },
        { name: 'Jotai', description: '原子化状态管理' },
      ]},
      { group: 'CSS 方案', options: [
        { name: 'Tailwind CSS', description: '原子化 CSS 框架' },
        { name: 'CSS Modules', description: '模块化 CSS，零依赖' },
      ]},
    ],
    'Vue 3': [
      { group: '状态管理', options: [
        { name: 'Pinia', description: 'Vue 官方状态管理' },
      ]},
      { group: 'CSS 方案', options: [
        { name: 'Tailwind CSS', description: '原子化 CSS 框架' },
        { name: 'UnoCSS', description: '即时按需原子化 CSS 引擎' },
      ]},
    ],
    Svelte: [
      { group: 'CSS 方案', options: [
        { name: 'Tailwind CSS', description: '原子化 CSS 框架' },
      ]},
    ],
    Angular: [
      { group: '状态管理', options: [
        { name: 'NgRx', description: 'Angular 响应式状态管理' },
      ]},
    ],
  },
  backend: {
    Express: [
      { group: 'ORM', options: [
        { name: 'Prisma', description: '类型安全的 ORM' },
        { name: 'Drizzle', description: '轻量 TypeScript ORM' },
        { name: 'TypeORM', description: '功能全面的 ORM' },
      ]},
    ],
    Fastify: [
      { group: 'ORM', options: [
        { name: 'Prisma', description: '类型安全的 ORM' },
        { name: 'Drizzle', description: '轻量 TypeScript ORM' },
      ]},
    ],
    NestJS: [
      { group: 'ORM', options: [
        { name: 'Prisma', description: '类型安全的 ORM' },
        { name: 'TypeORM', description: 'NestJS 官方集成' },
      ]},
    ],
  },
  database: {},
};

// APPEND_MARKER_2

export interface RequirementCategory {
  readonly key: string;
  readonly label: string;
  readonly required: boolean;
  readonly hint: string;
}

export const REQUIREMENT_CATEGORIES: readonly RequirementCategory[] = [
  { key: 'core', label: '核心功能', required: true, hint: '描述系统的主要功能模块，每个功能用 ## 标题分隔' },
  { key: 'users', label: '目标用户', required: false, hint: '描述目标用户群体和使用场景' },
  { key: 'nonfunctional', label: '非功能需求', required: false, hint: '性能、安全、可用性等要求' },
  { key: 'constraints', label: '技术约束', required: false, hint: '技术选型限制、部署环境、兼容性要求等' },
  { key: 'uiux', label: 'UI/UX 要求', required: false, hint: '界面风格、交互模式、响应式要求等' },
];

// --- PresetSuggestionProvider ---

class PresetSuggestionProvider implements SuggestionProvider {
  suggestTechStack(category: TechCategory): TechSuggestion[] {
    return TECH_PRESETS[category] ?? [];
  }

  suggestCompanions(category: TechCategory, chosen: string): CompanionSuggestion[] {
    return COMPANION_MAP[category]?.[chosen] ?? [];
  }

  analyzeRequirements(sections: RequirementSection[]): CompletenessReport {
    const allKeys = REQUIREMENT_CATEGORIES.map((c) => c.key);
    const filledKeys = sections.filter((s) => s.content.trim().length > 0).map((s) => s.category);
    const filled = REQUIREMENT_CATEGORIES.filter((c) => filledKeys.includes(c.key)).map((c) => c.label);
    const missingCats = REQUIREMENT_CATEGORIES.filter((c) => !filledKeys.includes(c.key));
    const missing = missingCats.map((c) => c.label);
    const suggestions = missingCats.map((c) => `建议补充「${c.label}」：${c.hint}`);
    const score = allKeys.length > 0 ? Math.round((filled.length / allKeys.length) * 100) : 0;
    return { score, filled, missing, suggestions };
  }

  suggestImprovements(content: string, feedback: string): string[] {
    const suggestions: string[] = [];
    const feedbackLower = feedback.toLowerCase();

    if (feedbackLower.includes('细') || feedbackLower.includes('详') || feedbackLower.includes('detail')) {
      suggestions.push('尝试为每个功能模块添加更具体的验收标准');
      suggestions.push('补充边界情况和异常流程的处理说明');
    }
    if (feedbackLower.includes('性能') || feedbackLower.includes('perf')) {
      suggestions.push('添加具体的性能指标（如响应时间、并发量）');
    }
    if (feedbackLower.includes('安全') || feedbackLower.includes('secur')) {
      suggestions.push('补充认证授权方案和数据安全要求');
    }
    if (feedbackLower.includes('测试') || feedbackLower.includes('test')) {
      suggestions.push('明确测试策略和覆盖率目标');
    }
    if (content.length < 200) {
      suggestions.push('当前内容较短，建议扩展功能描述的深度');
    }
    if (!content.includes('##')) {
      suggestions.push('建议使用 ## 标题分隔不同功能模块，便于后续任务拆分');
    }
    if (suggestions.length === 0) {
      suggestions.push('根据反馈意见重新审视文档结构和内容完整性');
    }
    return suggestions;
  }
}

export function createSuggestionProvider(): SuggestionProvider {
  return new PresetSuggestionProvider();
}
