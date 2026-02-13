import type { TaskItem, TaskIndex } from '../types/index.js';

export interface TaskSplitInput {
  requirements: string;
  spec: string;
}

/**
 * 将需求文本按 Markdown 二级标题拆分为任务列表。
 * 每个 `## 标题` 块变成一个独立任务。
 * 智能依赖分析：通过关键词检测推断任务间的依赖关系。
 */
export function splitRequirementsIntoTasks(input: TaskSplitInput): TaskIndex {
  const { requirements } = input;
  const sections = parseMarkdownSections(requirements);
  const now = new Date().toISOString();

  const tasks: TaskItem[] = sections.map((section, idx) => {
    const id = `task-${String(idx + 1).padStart(3, '0')}`;
    return {
      id,
      title: section.title,
      status: 'pending' as const,
      dependencies: [],
      priority: idx + 1,
      createdAt: now,
      completedAt: null,
    };
  });

  // 智能依赖分析
  resolveDependencies(tasks, sections);

  const executionOrder = topologicalSort(tasks);

  return { tasks, executionOrder };
}

export function generateTaskMarkdown(task: TaskItem, body: string): string {
  const depStr = task.dependencies.length > 0 ? task.dependencies.join(', ') : '无';

  return [
    `# ${task.id}: ${task.title}`,
    '',
    `- 状态：${task.status}`,
    `- 优先级：${task.priority}`,
    `- 依赖：${depStr}`,
    `- 创建时间：${task.createdAt}`,
    '',
    '## 描述与验收标准',
    '',
    body,
    '',
    '## Claude Code 执行指令',
    '',
    `请实现任务 "${task.title}"，确保：`,
    '1. 代码通过 TypeScript 编译',
    '2. 编写对应的单元测试',
    '3. 测试全部通过',
    '',
  ].join('\n');
}

interface MarkdownSection {
  title: string;
  body: string;
}

function parseMarkdownSections(md: string): MarkdownSection[] {
  const lines = md.split('\n');
  const sections: MarkdownSection[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
      }
      currentTitle = match[1].trim();
      currentBody = [];
    } else if (currentTitle) {
      currentBody.push(line);
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, body: currentBody.join('\n').trim() });
  }

  // 如果没有二级标题，把整个文本作为一个任务
  if (sections.length === 0 && md.trim().length > 0) {
    sections.push({ title: '实现需求', body: md.trim() });
  }

  return sections;
}

// --- 智能依赖分析 ---

const DEPENDENCY_KEYWORDS: Record<string, string[]> = {
  '数据库': ['数据模型', '数据库', 'schema', 'model', '表结构', 'ORM'],
  '认证': ['登录', '注册', '认证', '授权', 'auth', 'login', 'signup'],
  'API': ['接口', 'API', 'endpoint', '路由', 'route'],
  'UI': ['界面', '页面', '组件', 'UI', 'component', 'view'],
};

/**
 * 通过关键词匹配推断任务间的依赖关系。
 * 规则：如果任务 B 的内容引用了任务 A 的标题关键词，则 B 依赖 A。
 * 同时保留顺序依赖作为兜底。
 */
function resolveDependencies(tasks: TaskItem[], sections: MarkdownSection[]): void {
  if (tasks.length <= 1) return;

  const titleMap = new Map<number, string[]>();
  for (let i = 0; i < sections.length; i++) {
    const keywords = extractKeywords(sections[i].title);
    titleMap.set(i, keywords);
  }

  for (let i = 1; i < tasks.length; i++) {
    const bodyLower = (sections[i].body + ' ' + sections[i].title).toLowerCase();
    const deps: string[] = [];

    for (let j = 0; j < i; j++) {
      const keywords = titleMap.get(j) ?? [];
      const titleMatch = keywords.some((kw) => bodyLower.includes(kw));
      if (titleMatch) {
        deps.push(tasks[j].id);
      }
    }

    // 如果没有检测到语义依赖，使用顺序依赖（前一个任务）
    if (deps.length === 0) {
      deps.push(tasks[i - 1].id);
    }

    tasks[i].dependencies = deps;
  }
}

function extractKeywords(title: string): string[] {
  const lower = title.toLowerCase();
  const keywords = [lower];

  for (const [, kws] of Object.entries(DEPENDENCY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) {
        keywords.push(...kws.map((k) => k.toLowerCase()));
        break;
      }
    }
  }

  return [...new Set(keywords)];
}

/**
 * 拓扑排序，确保依赖在前。
 */
function topologicalSort(tasks: TaskItem[]): string[] {
  const idSet = new Set(tasks.map((t) => t.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }

  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (idSet.has(dep)) {
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  const queue = tasks.filter((t) => (inDegree.get(t.id) ?? 0) === 0).map((t) => t.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    for (const next of adj.get(current) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  // 如果有环，追加剩余任务
  if (result.length < tasks.length) {
    for (const t of tasks) {
      if (!result.includes(t.id)) result.push(t.id);
    }
  }

  return result;
}
