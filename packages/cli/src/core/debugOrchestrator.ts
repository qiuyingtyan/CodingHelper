import type { Config, DebugScope, DebugLog } from '../types/index.js';

interface DebugInput {
  readonly config: Config;
  readonly scope: DebugScope;
  readonly errorLog?: string;
}

/**
 * 根据 scope 和技术栈生成 debug 分析指令，注入到 CLAUDE.md 供 Claude Code 使用。
 */
export function generateDebugInstructions(input: DebugInput): DebugLog {
  const { config, scope, errorLog } = input;
  const findings: string[] = [];
  const instructions: string[] = [];

  const scopes = scope === 'all'
    ? (['front', 'back', 'db'] as const)
    : [scope];

  for (const s of scopes) {
    const result = analyzeScope(s, config, errorLog);
    findings.push(...result.findings);
    instructions.push(...result.instructions);
  }

  const claudeMdInstructions = buildClaudeMdBlock(config, scope, findings, instructions);

  return {
    scope,
    timestamp: new Date().toISOString(),
    findings,
    claudeMdInstructions,
  };
}

interface ScopeAnalysis {
  findings: string[];
  instructions: string[];
}

function analyzeScope(scope: 'front' | 'back' | 'db', config: Config, errorLog?: string): ScopeAnalysis {
  const findings: string[] = [];
  const instructions: string[] = [];
  const stack = config.techStack;

  switch (scope) {
    case 'front': {
      const fw = stack.frontend ?? '未知前端框架';
      findings.push(`前端框架：${fw}`);
      instructions.push(
        `检查 ${fw} 组件的生命周期和状态管理是否正确`,
        '检查浏览器控制台是否有未捕获的异常',
        '验证 API 请求的参数和响应格式',
        '检查路由配置和导航守卫',
      );
      if (fw.toLowerCase().includes('vue')) {
        instructions.push('检查 reactive/ref 响应式数据是否正确解包');
      } else if (fw.toLowerCase().includes('react')) {
        instructions.push('检查 useEffect 依赖数组和清理函数');
      }
      break;
    }
    case 'back': {
      const fw = stack.backend ?? '未知后端框架';
      findings.push(`后端框架：${fw}`);
      instructions.push(
        `检查 ${fw} 路由和中间件配置`,
        '验证请求参数校验和错误处理中间件',
        '检查数据库查询是否有 N+1 问题',
        '确认环境变量和配置文件是否正确加载',
      );
      break;
    }
    case 'db': {
      const db = stack.database ?? '未知数据库';
      findings.push(`数据库：${db}`);
      instructions.push(
        `检查 ${db} 连接配置和连接池状态`,
        '验证数据库 migration 是否已执行',
        '检查索引是否覆盖常用查询',
        '确认事务处理和并发控制是否正确',
      );
      break;
    }
  }

  if (errorLog) {
    findings.push(`用户提供的错误日志：${errorLog.slice(0, 200)}`);
    instructions.push('根据以上错误日志定位问题根因，优先修复');
  }

  return { findings, instructions };
}

function buildClaudeMdBlock(
  config: Config,
  scope: DebugScope,
  findings: string[],
  instructions: string[],
): string {
  const lines = [
    `### Debug 模式 — 项目：${config.projectName}`,
    `范围：${scope}`,
    '',
    '#### 分析发现',
    ...findings.map((f) => `- ${f}`),
    '',
    '#### 调试指令',
    ...instructions.map((inst, i) => `${i + 1}. ${inst}`),
    '',
    '请按以上指令逐步排查，修复后运行测试验证。',
  ];
  return lines.join('\n');
}
