import type { TaskItem, TaskIndex } from '../types/index.js';

export interface TaskSplitInput {
  requirements: string;
  spec: string;
}

/**
 * 将需求文本按 Markdown 二级标题拆分为任务列表。
 * 每个 `## 标题` 块变成一个独立任务。
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
      dependencies: idx > 0 ? [`task-${String(idx).padStart(3, '0')}`] : [],
      priority: idx + 1,
      createdAt: now,
      completedAt: null,
    };
  });

  const executionOrder = tasks.map((t) => t.id);

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
