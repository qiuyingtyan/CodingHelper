import { describe, it, expect } from 'vitest';
import {
  createSuggestionProvider,
  TECH_PRESETS,
  REQUIREMENT_CATEGORIES,
  type TechCategory,
  type RequirementSection,
} from '../suggestionEngine.js';

describe('SuggestionEngine', () => {
  const provider = createSuggestionProvider();

  describe('suggestTechStack', () => {
    it.each(['frontend', 'backend', 'database'] as TechCategory[])('returns non-empty list for %s', (cat) => {
      const result = provider.suggestTechStack(cat);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
    });

    it('returns same data as TECH_PRESETS', () => {
      expect(provider.suggestTechStack('frontend')).toEqual(TECH_PRESETS.frontend);
    });
  });

  describe('suggestCompanions', () => {
    it('returns companion suggestions for React', () => {
      const result = provider.suggestCompanions('frontend', 'React');
      expect(result.length).toBeGreaterThan(0);
      const groups = result.map((r) => r.group);
      expect(groups).toContain('状态管理');
      expect(groups).toContain('CSS 方案');
    });

    it('returns companion suggestions for Vue 3', () => {
      const result = provider.suggestCompanions('frontend', 'Vue 3');
      expect(result.length).toBeGreaterThan(0);
      expect(result.find((r) => r.group === '状态管理')?.options[0].name).toBe('Pinia');
    });

    it('returns ORM suggestions for Express', () => {
      const result = provider.suggestCompanions('backend', 'Express');
      expect(result.length).toBeGreaterThan(0);
      const ormGroup = result.find((r) => r.group === 'ORM');
      expect(ormGroup).toBeDefined();
      expect(ormGroup!.options.map((o) => o.name)).toContain('Prisma');
    });

    it('returns empty array for unknown tech', () => {
      expect(provider.suggestCompanions('frontend', 'UnknownFramework')).toEqual([]);
    });

    it('returns empty array for database companions', () => {
      expect(provider.suggestCompanions('database', 'PostgreSQL')).toEqual([]);
    });
  });
  describe('analyzeRequirements', () => {
    it('returns 100% when all categories filled', () => {
      const sections: RequirementSection[] = REQUIREMENT_CATEGORIES.map((c) => ({
        category: c.key,
        content: '一些内容',
      }));
      const report = provider.analyzeRequirements(sections);
      expect(report.score).toBe(100);
      expect(report.missing).toHaveLength(0);
      expect(report.filled).toHaveLength(REQUIREMENT_CATEGORIES.length);
    });

    it('returns 20% when only core is filled', () => {
      const sections: RequirementSection[] = [{ category: 'core', content: '核心功能描述' }];
      const report = provider.analyzeRequirements(sections);
      expect(report.score).toBe(20);
      expect(report.filled).toEqual(['核心功能']);
      expect(report.missing).toHaveLength(4);
      expect(report.suggestions.length).toBeGreaterThan(0);
    });

    it('ignores empty content sections', () => {
      const sections: RequirementSection[] = [
        { category: 'core', content: '有内容' },
        { category: 'users', content: '  ' },
      ];
      const report = provider.analyzeRequirements(sections);
      expect(report.score).toBe(20);
      expect(report.filled).toEqual(['核心功能']);
    });

    it('returns 0% for empty input', () => {
      const report = provider.analyzeRequirements([]);
      expect(report.score).toBe(0);
      expect(report.missing).toHaveLength(REQUIREMENT_CATEGORIES.length);
    });
  });

  describe('suggestImprovements', () => {
    it('suggests detail improvements for vague feedback', () => {
      const result = provider.suggestImprovements('短内容', '需要更详细');
      expect(result.some((s) => s.includes('验收标准'))).toBe(true);
    });

    it('suggests performance improvements', () => {
      const result = provider.suggestImprovements('内容', '性能不够');
      expect(result.some((s) => s.includes('性能指标'))).toBe(true);
    });

    it('suggests security improvements', () => {
      const result = provider.suggestImprovements('内容', '安全性不足');
      expect(result.some((s) => s.includes('认证授权'))).toBe(true);
    });

    it('suggests test improvements', () => {
      const result = provider.suggestImprovements('内容', '测试不够');
      expect(result.some((s) => s.includes('测试策略'))).toBe(true);
    });

    it('suggests structure when no ## headings', () => {
      const result = provider.suggestImprovements('没有标题的内容', '一般');
      expect(result.some((s) => s.includes('##'))).toBe(true);
    });

    it('suggests expanding short content', () => {
      const result = provider.suggestImprovements('短', '还行');
      expect(result.some((s) => s.includes('较短'))).toBe(true);
    });

    it('returns fallback suggestion when no keywords match', () => {
      const longContent = '## 功能\n' + 'x'.repeat(300);
      const result = provider.suggestImprovements(longContent, '不太好');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
