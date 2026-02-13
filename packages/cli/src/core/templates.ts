import type { TechStack } from '../types/index.js';

export interface ProjectTemplate {
  readonly name: string;
  readonly description: string;
  readonly techStack: TechStack;
}

const TEMPLATES: readonly ProjectTemplate[] = [
  {
    name: 'vue-express',
    description: 'Vue 3 + Express + PostgreSQL 全栈项目',
    techStack: { frontend: 'Vue 3', backend: 'Express', database: 'PostgreSQL' },
  },
  {
    name: 'react-nestjs',
    description: 'React 18 + NestJS + MySQL 全栈项目',
    techStack: { frontend: 'React 18', backend: 'NestJS', database: 'MySQL' },
  },
  {
    name: 'vue-fastapi',
    description: 'Vue 3 + FastAPI + PostgreSQL 全栈项目',
    techStack: { frontend: 'Vue 3', backend: 'FastAPI', database: 'PostgreSQL' },
  },
  {
    name: 'react-express',
    description: 'React 18 + Express + MongoDB 全栈项目',
    techStack: { frontend: 'React 18', backend: 'Express', database: 'MongoDB' },
  },
  {
    name: 'nuxt',
    description: 'Nuxt 3 全栈项目（内置 Nitro 服务端）',
    techStack: { frontend: 'Nuxt 3', backend: 'Nitro', database: 'SQLite' },
  },
  {
    name: 'nextjs',
    description: 'Next.js 14 全栈项目（App Router）',
    techStack: { frontend: 'Next.js 14', backend: 'Next.js API Routes', database: 'PostgreSQL' },
  },
  {
    name: 'express-api',
    description: 'Express 纯后端 API 项目',
    techStack: { backend: 'Express', database: 'PostgreSQL' },
  },
  {
    name: 'fastapi',
    description: 'FastAPI 纯后端 API 项目',
    techStack: { backend: 'FastAPI', database: 'PostgreSQL' },
  },
];

export function listTemplates(): readonly ProjectTemplate[] {
  return TEMPLATES;
}

export function findTemplate(name: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.name === name);
}

export function templateNames(): string[] {
  return TEMPLATES.map((t) => t.name);
}
