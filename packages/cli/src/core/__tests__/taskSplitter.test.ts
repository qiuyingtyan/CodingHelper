import { describe, it, expect } from 'vitest';
import { splitRequirementsIntoTasks, generateTaskMarkdown } from '../taskSplitter.js';

describe('splitRequirementsIntoTasks', () => {
  it('splits by h2 headings', () => {
    const requirements = [
      '## 用户登录',
      '支持邮箱密码登录',
      '',
      '## 用户注册',
      '支持邮箱注册',
      '',
      '## 个人中心',
      '查看个人信息',
    ].join('\n');

    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].title).toBe('用户登录');
    expect(result.tasks[1].title).toBe('用户注册');
    expect(result.tasks[2].title).toBe('个人中心');
  });

  it('sets sequential dependencies as fallback', () => {
    const requirements = '## A\nbody\n## B\nbody\n## C\nbody';
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.tasks[0].dependencies).toEqual([]);
    // 无语义关联时，回退到顺序依赖
    expect(result.tasks[1].dependencies).toEqual(['task-001']);
    expect(result.tasks[2].dependencies).toEqual(['task-002']);
  });

  it('detects semantic dependencies via keywords', () => {
    const requirements = [
      '## 数据库模型',
      '创建用户表和文章表',
      '',
      '## API 接口',
      '实现 REST API',
      '',
      '## 用户界面',
      '基于 API 接口实现前端页面，展示数据库模型数据',
    ].join('\n');
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.tasks[0].dependencies).toEqual([]);
    // API 接口 → 依赖数据库模型（关键词匹配）
    expect(result.tasks[1].dependencies).toContain('task-001');
    // 用户界面 → 依赖 API 接口和数据库模型
    expect(result.tasks[2].dependencies.length).toBeGreaterThanOrEqual(1);
  });

  it('generates correct execution order', () => {
    const requirements = '## X\n\n## Y\n';
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.executionOrder).toEqual(['task-001', 'task-002']);
  });

  it('handles no headings as single task', () => {
    const requirements = '实现一个简单的计算器';
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('实现需求');
  });

  it('handles empty input', () => {
    const result = splitRequirementsIntoTasks({ requirements: '', spec: '' });
    expect(result.tasks).toHaveLength(0);
  });

  it('assigns correct IDs and priorities', () => {
    const requirements = '## A\n\n## B\n';
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    expect(result.tasks[0].id).toBe('task-001');
    expect(result.tasks[0].priority).toBe(1);
    expect(result.tasks[1].id).toBe('task-002');
    expect(result.tasks[1].priority).toBe(2);
  });

  it('all tasks start as pending', () => {
    const requirements = '## A\n\n## B\n';
    const result = splitRequirementsIntoTasks({ requirements, spec: '' });
    for (const task of result.tasks) {
      expect(task.status).toBe('pending');
      expect(task.completedAt).toBeNull();
    }
  });
});

describe('generateTaskMarkdown', () => {
  it('generates correct markdown', () => {
    const task = {
      id: 'task-001',
      title: '用户登录',
      status: 'pending' as const,
      dependencies: [],
      priority: 1,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: null,
    };
    const md = generateTaskMarkdown(task, '实现邮箱密码登录');
    expect(md).toContain('# task-001: 用户登录');
    expect(md).toContain('状态：pending');
    expect(md).toContain('依赖：无');
    expect(md).toContain('实现邮箱密码登录');
  });

  it('shows dependencies', () => {
    const task = {
      id: 'task-002',
      title: '注册',
      status: 'pending' as const,
      dependencies: ['task-001'],
      priority: 2,
      createdAt: '2025-01-01T00:00:00Z',
      completedAt: null,
    };
    const md = generateTaskMarkdown(task, 'body');
    expect(md).toContain('依赖：task-001');
  });
});
