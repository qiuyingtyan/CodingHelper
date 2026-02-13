import { describe, it, expect } from 'vitest';
import { generateRequirementsDoc } from '../planner.js';
import type { Config } from '../../types/index.js';

const baseConfig: Config = {
  projectName: 'TestApp',
  description: 'A test application',
  techStack: { frontend: 'Vue 3', backend: 'Express', database: 'PostgreSQL' },
  createdAt: '2025-01-01T00:00:00Z',
  currentPhase: 'plan',
  version: '1.0.0',
};

describe('generateRequirementsDoc', () => {
  it('includes project name in title', () => {
    const doc = generateRequirementsDoc({ requirements: '用户登录功能', config: baseConfig });
    expect(doc).toContain('# TestApp');
  });

  it('includes tech stack', () => {
    const doc = generateRequirementsDoc({ requirements: '功能A', config: baseConfig });
    expect(doc).toContain('Vue 3');
    expect(doc).toContain('Express');
    expect(doc).toContain('PostgreSQL');
  });

  it('includes requirements text', () => {
    const req = '## 用户登录\n\n支持邮箱密码登录';
    const doc = generateRequirementsDoc({ requirements: req, config: baseConfig });
    expect(doc).toContain('用户登录');
    expect(doc).toContain('支持邮箱密码登录');
  });

  it('handles empty description', () => {
    const config = { ...baseConfig, description: '' };
    const doc = generateRequirementsDoc({ requirements: 'test', config });
    expect(doc).toContain('_（未填写）_');
  });

  it('handles empty tech stack', () => {
    const config = { ...baseConfig, techStack: {} };
    const doc = generateRequirementsDoc({ requirements: 'test', config });
    expect(doc).toContain('_（未指定）_');
  });
});
