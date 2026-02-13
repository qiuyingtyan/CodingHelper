import { describe, it, expect } from 'vitest';
import { generateSpecDoc, generateClaudeMd } from '../specGenerator.js';
import type { Config } from '../../types/index.js';

const baseConfig: Config = {
  projectName: 'TestApp',
  description: 'A test app',
  techStack: { frontend: 'Vue 3', backend: 'Express', database: 'PostgreSQL' },
  createdAt: '2025-01-01T00:00:00Z',
  currentPhase: 'spec',
  version: '1.0.0',
};

describe('generateSpecDoc', () => {
  it('includes project name', () => {
    const doc = generateSpecDoc({ config: baseConfig, requirements: '' });
    expect(doc).toContain('# TestApp');
  });

  it('includes tech stack in architecture', () => {
    const doc = generateSpecDoc({ config: baseConfig, requirements: '' });
    expect(doc).toContain('Vue 3');
    expect(doc).toContain('Express');
    expect(doc).toContain('PostgreSQL');
  });

  it('includes coding standards', () => {
    const doc = generateSpecDoc({ config: baseConfig, requirements: '' });
    expect(doc).toContain('TypeScript 严格模式');
    expect(doc).toContain('script setup');
  });

  it('includes test strategy', () => {
    const doc = generateSpecDoc({ config: baseConfig, requirements: '' });
    expect(doc).toContain('Vitest');
    expect(doc).toContain('Vue Test Utils');
    expect(doc).toContain('80%');
  });
});

describe('generateClaudeMd', () => {
  it('includes project name in title', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: 'req' });
    expect(md).toContain('CLAUDE.md — TestApp');
  });

  it('includes project constraints', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: 'req' });
    expect(md).toContain('项目名称：TestApp');
    expect(md).toContain('A test app');
  });

  it('includes tech stack', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: '' });
    expect(md).toContain('前端：Vue 3');
    expect(md).toContain('后端：Express');
    expect(md).toContain('数据库：PostgreSQL');
  });

  it('includes requirements', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: '实现用户登录' });
    expect(md).toContain('实现用户登录');
  });

  it('handles partial tech stack', () => {
    const config = { ...baseConfig, techStack: { frontend: 'React' } };
    const md = generateClaudeMd({ config, requirements: '' });
    expect(md).toContain('前端：React');
    expect(md).not.toContain('后端：');
  });

  it('includes strategy-based coding standards', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: '' });
    expect(md).toContain('TypeScript 严格模式');
    expect(md).toContain('script setup');
  });

  it('includes error handling section', () => {
    const md = generateClaudeMd({ config: baseConfig, requirements: '' });
    expect(md).toContain('错误处理');
  });
});
