import { describe, it, expect } from 'vitest';
import { resolveSpecStrategy } from '../specStrategies.js';
import type { TechStack } from '../../types/index.js';

describe('specStrategies', () => {
  it('returns react strategy for React frontend', () => {
    const strategy = resolveSpecStrategy({ frontend: 'React 18' });
    expect(strategy.directoryStructure).toContain('hooks/');
    expect(strategy.codingStandards.join(' ')).toContain('Hooks');
    expect(strategy.testStrategy.join(' ')).toContain('React Testing Library');
  });

  it('returns react strategy for Next.js', () => {
    const strategy = resolveSpecStrategy({ frontend: 'Next.js' });
    expect(strategy.directoryStructure).toContain('hooks/');
  });

  it('returns vue strategy for Vue frontend', () => {
    const strategy = resolveSpecStrategy({ frontend: 'Vue 3' });
    expect(strategy.directoryStructure).toContain('composables/');
    expect(strategy.codingStandards.join(' ')).toContain('script setup');
    expect(strategy.testStrategy.join(' ')).toContain('Vue Test Utils');
  });

  it('returns vue strategy for Nuxt', () => {
    const strategy = resolveSpecStrategy({ frontend: 'Nuxt 3' });
    expect(strategy.directoryStructure).toContain('composables/');
  });

  it('returns express strategy for Express backend', () => {
    const strategy = resolveSpecStrategy({ backend: 'Express' });
    expect(strategy.directoryStructure).toContain('routes/');
    expect(strategy.directoryStructure).toContain('controllers/');
    expect(strategy.testStrategy.join(' ')).toContain('supertest');
  });

  it('returns express strategy for Fastify', () => {
    const strategy = resolveSpecStrategy({ backend: 'Fastify' });
    expect(strategy.directoryStructure).toContain('routes/');
  });

  it('returns express strategy for Koa', () => {
    const strategy = resolveSpecStrategy({ backend: 'Koa' });
    expect(strategy.directoryStructure).toContain('routes/');
  });

  it('returns express strategy for Hono', () => {
    const strategy = resolveSpecStrategy({ backend: 'Hono' });
    expect(strategy.directoryStructure).toContain('routes/');
  });

  it('returns nestjs strategy for NestJS backend', () => {
    const strategy = resolveSpecStrategy({ backend: 'NestJS' });
    expect(strategy.directoryStructure).toContain('modules/');
    expect(strategy.codingStandards.join(' ')).toContain('NestJS');
    expect(strategy.testStrategy.join(' ')).toContain('createTestingModule');
  });

  it('returns default strategy for unknown tech stack', () => {
    const strategy = resolveSpecStrategy({ frontend: 'Svelte', backend: 'Django' });
    expect(strategy.directoryStructure).toContain('components/');
    expect(strategy.codingStandards.join(' ')).toContain('TypeScript');
  });

  it('returns default strategy for empty tech stack', () => {
    const strategy = resolveSpecStrategy({});
    expect(strategy.directoryStructure).toContain('src/');
    expect(strategy.testStrategy.join(' ')).toContain('Vitest');
  });

  it('frontend takes priority over backend for strategy detection', () => {
    // React frontend + Express backend → should pick React
    const strategy = resolveSpecStrategy({ frontend: 'React', backend: 'Express' });
    expect(strategy.directoryStructure).toContain('hooks/');
  });

  it('all strategies have required fields', () => {
    const stacks: TechStack[] = [
      { frontend: 'React' },
      { frontend: 'Vue 3' },
      { backend: 'Express' },
      { backend: 'NestJS' },
      {},
    ];
    for (const stack of stacks) {
      const s = resolveSpecStrategy(stack);
      expect(s.directoryStructure).toBeTruthy();
      expect(s.codingStandards.length).toBeGreaterThan(0);
      expect(s.errorHandling.length).toBeGreaterThan(0);
      expect(s.testStrategy.length).toBeGreaterThan(0);
    }
  });
});
