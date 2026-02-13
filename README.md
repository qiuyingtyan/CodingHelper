# CodingHelper

AI 辅助编程工作流 CLI — 充当 Claude Code 的项目经理，将需求自动拆解为可执行的任务序列。

## 它解决什么问题

直接把大段需求丢给 AI 编码助手，往往得到零散、不连贯的结果。CodingHelper 在你和 Claude Code 之间加了一层结构化流程：

```
需求输入 → 需求文档 → 技术规范 → 任务拆分 → 逐个执行 → 完成
```

每个阶段都有审阅确认环节，确保方向正确后再进入下一步。

## 核心特性

- **6 阶段工作流** — init / plan / spec / task / run / done，严格按序推进
- **智能技术栈推荐** — 内置主流前端、后端、数据库方案及配套建议
- **需求完整度分析** — 自动评分并给出改进建议，低于 40% 会阻断流程
- **自动任务拆分** — 按 Markdown `## ` 标题切分需求，自动建立依赖关系
- **CLAUDE.md 生成** — 为 Claude Code 生成专用上下文约束文件
- **任务状态追踪** — pending → in_progress → completed，支持随时查看进度

## 安装

```bash
git clone <repo-url> && cd CodingHelper

pnpm install
pnpm build

# 全局链接（可选）
cd packages/cli && pnpm link --global
```

## 快速开始

```bash
cd your-project

# 1. 初始化 — 填写项目名称、描述、技术栈
codinghelper init

# 2. 需求分析 — 输入需求，生成 requirements.md
codinghelper plan

# 3. 技术规范 — 生成 spec.md 和 CLAUDE.md
codinghelper spec

# 4. 任务拆分 — 按需求标题拆分为独立任务
codinghelper task

# 5. 执行循环 — 逐个完成任务
codinghelper run     # 展示下一个任务
codinghelper done    # 标记完成，继续下一个

# 随时查看进度
codinghelper status
```

> 需求输入建议用 `## 标题` 分隔功能模块，任务拆分会按 h2 标题自动切分。

## 生成的文件结构

执行工作流后，项目目录下会生成：

```
.codinghelper/
├── config.json          # 项目配置（名称、技术栈等）
├── requirements.md      # 结构化需求文档
├── spec.md              # 技术规范（架构、目录、编码标准）
├── CLAUDE.md            # Claude Code 专用约束文件
└── tasks/
    ├── index.json       # 任务索引与执行顺序
    ├── task-001.md      # 任务详情与验收标准
    ├── task-002.md
    └── ...
```

## 项目源码结构

```
CodingHelper/
├── packages/
│   └── cli/
│       └── src/
│           ├── commands/          # CLI 命令（init, plan, spec, task, run, done）
│           ├── core/              # 核心引擎
│           │   ├── planner.ts         # 需求文档生成
│           │   ├── specGenerator.ts   # 技术规范生成
│           │   ├── taskSplitter.ts    # 任务拆分
│           │   ├── approvalManager.ts # 审阅确认流程
│           │   └── suggestionEngine.ts# 技术栈推荐
│           ├── types/             # Zod schema 与类型定义
│           ├── utils/             # 工具函数（文件 I/O、终端显示等）
│           └── __tests__/         # 单元测试与集成测试
├── docs/
│   └── dev-guide.md               # 开发文档
├── package.json                   # pnpm workspace 根配置
└── tsconfig.base.json             # 共享 TypeScript 配置
```

## 技术栈

| 类别 | 选型 |
|------|------|
| 语言 | TypeScript (strict mode, ESM) |
| CLI 框架 | Commander.js |
| 交互提示 | @inquirer/prompts |
| 数据校验 | Zod |
| 构建工具 | tsup |
| 测试框架 | Vitest |
| 包管理 | pnpm (monorepo workspace) |

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test

# 开发模式（监听文件变化）
cd packages/cli && pnpm dev
```

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
