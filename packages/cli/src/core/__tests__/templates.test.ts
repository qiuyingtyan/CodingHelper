import { describe, it, expect } from 'vitest';
import { listTemplates, findTemplate, templateNames } from '../templates.js';

describe('templates', () => {
  it('listTemplates returns all templates', () => {
    const templates = listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(6);
    expect(templates.every((t) => t.name && t.description && t.techStack)).toBe(true);
  });

  it('findTemplate returns matching template', () => {
    const tpl = findTemplate('vue-express');
    expect(tpl).toBeDefined();
    expect(tpl!.techStack.frontend).toBe('Vue 3');
    expect(tpl!.techStack.backend).toBe('Express');
    expect(tpl!.techStack.database).toBe('PostgreSQL');
  });

  it('findTemplate returns undefined for unknown name', () => {
    expect(findTemplate('nonexistent')).toBeUndefined();
  });

  it('templateNames returns array of name strings', () => {
    const names = templateNames();
    expect(names).toContain('vue-express');
    expect(names).toContain('react-nestjs');
    expect(names).toContain('express-api');
    expect(names.length).toBe(listTemplates().length);
  });

  it('each template has a unique name', () => {
    const names = templateNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it('backend-only templates have no frontend', () => {
    const api = findTemplate('express-api');
    expect(api).toBeDefined();
    expect(api!.techStack.frontend).toBeUndefined();
    expect(api!.techStack.backend).toBe('Express');
  });
});
