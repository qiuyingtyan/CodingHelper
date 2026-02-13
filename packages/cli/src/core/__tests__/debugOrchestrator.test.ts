import { describe, it, expect } from 'vitest';
import { generateDebugInstructions } from '../debugOrchestrator.js';
import type { Config } from '../../types/index.js';

const baseConfig: Config = {
  projectName: 'test-project',
  description: 'A test project',
  techStack: { frontend: 'Vue 3', backend: 'Express', database: 'PostgreSQL' },
  createdAt: '2025-01-01T00:00:00.000Z',
  currentPhase: 'run',
  version: '0.1.0',
};

describe('debugOrchestrator', () => {
  it('generates instructions for front scope', () => {
    const result = generateDebugInstructions({ config: baseConfig, scope: 'front' });
    expect(result.scope).toBe('front');
    expect(result.findings.some((f) => f.includes('Vue 3'))).toBe(true);
    expect(result.claudeMdInstructions).toContain('Vue');
    expect(result.claudeMdInstructions).toContain('reactive/ref');
  });

  it('generates instructions for back scope', () => {
    const result = generateDebugInstructions({ config: baseConfig, scope: 'back' });
    expect(result.scope).toBe('back');
    expect(result.findings.some((f) => f.includes('Express'))).toBe(true);
    expect(result.claudeMdInstructions).toContain('Express');
  });

  it('generates instructions for db scope', () => {
    const result = generateDebugInstructions({ config: baseConfig, scope: 'db' });
    expect(result.scope).toBe('db');
    expect(result.findings.some((f) => f.includes('PostgreSQL'))).toBe(true);
    expect(result.claudeMdInstructions).toContain('PostgreSQL');
  });

  it('generates instructions for all scopes combined', () => {
    const result = generateDebugInstructions({ config: baseConfig, scope: 'all' });
    expect(result.scope).toBe('all');
    expect(result.findings.length).toBeGreaterThanOrEqual(3);
    expect(result.claudeMdInstructions).toContain('Vue 3');
    expect(result.claudeMdInstructions).toContain('Express');
    expect(result.claudeMdInstructions).toContain('PostgreSQL');
  });

  it('includes error log in findings and instructions when provided', () => {
    const result = generateDebugInstructions({
      config: baseConfig,
      scope: 'front',
      errorLog: 'TypeError: Cannot read property of undefined',
    });
    expect(result.findings.some((f) => f.includes('TypeError'))).toBe(true);
    expect(result.claudeMdInstructions).toContain('错误日志');
  });

  it('handles React frontend with useEffect hint', () => {
    const reactConfig: Config = {
      ...baseConfig,
      techStack: { frontend: 'React 18', backend: 'NestJS', database: 'MySQL' },
    };
    const result = generateDebugInstructions({ config: reactConfig, scope: 'front' });
    expect(result.claudeMdInstructions).toContain('useEffect');
  });

  it('returns valid timestamp in ISO format', () => {
    const result = generateDebugInstructions({ config: baseConfig, scope: 'db' });
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });
});
