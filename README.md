# CodingHelper

AI 辅助编程工作流 CLI — 充当 Claude Code 的项目经理，将需求自动拆解为可执行的任务序列。

## 它解决什么问题

直接把大段需求丢给 AI 编码助手，往往得到零散、不连贯的结果。CodingHelper 在你和 Claude Code 之间加了一层结构化流程：

```
需求输入 → 需求文档 → 技术规范 → 任务拆分 → 逐个执行 → 审查 → 完成
```

每个阶段都有审阅确认环节，确保方向正确后再进入下一步。

## 核心特性

- **8 阶段工作流** — init / plan / spec / task / run / done / debug / review，严格按序推进
- **智能技术栈推荐** — 内置主流前端、后端、数据库方案及配套建议
- **需求完整度分析** — 自动评分并给出改进建议，低于 40% 会阻断流程
- **策略模式规范生成** — 根据技术栈（Vue/React/Express/Django/FastAPI 等）自动适配目录结构、编码标准和测试策略
- **智能任务拆分** — 按 Markdown `## ` 标题切分需求，语义分析自动建立依赖关系
- **CLAUDE.md 动态管理** — 为 Claude Code 生成并动态注入任务上下文和调试指令
- **调试分析** — 按技术栈层级（前端/后端/数据库）生成针对性调试指令
- **任务审查** — 支持审批/驳回流程，记录审查历史
- **任务状态追踪** — pending → in_progress → completed / rejected，支持恢复中断任务
- **执行历史记录** — 自动记录所有任务操作（启动、完成、驳回、恢复）
- **项目模板** — 8 套预设模板快速初始化（vue-express、react-nestjs、nextjs 等）
- **Web Dashboard** — 可视化面板查看项目状态和任务进度

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
# 或使用模板快速初始化
codinghelper init --template vue-express

# 2. 需求分析 — 输入需求，生成 requirements.md
codinghelper plan

# 3. 技术规范 — 生成 spec.md 和 CLAUDE.md
codinghelper spec
# 强制重新生成
codinghelper spec --regenerate

# 4. 任务拆分 — 按需求标题拆分为独立任务
codinghelper task

# 5. 执行循环 — 逐个完成任务
codinghelper run          # 展示并启动下一个任务
codinghelper run --resume # 恢复上次中断的任务
codinghelper run --dry-run       # 预览下一个任务（不修改状态）
codinghelper run --dry-run --all # 预览所有待执行任务
codinghelper done         # 标记当前任务完成

# 6. 审查任务
codinghelper review                        # 查看待审查任务
codinghelper review --approve              # 审查通过
codinghelper review --reject -c "需要修改"  # 驳回并附评论
codinghelper review --task task-003 --approve  # 指定任务审查

# 7. 调试分析 — 遇到问题时生成调试指令
codinghelper debug                         # 全栈调试
codinghelper debug --scope front           # 仅前端
codinghelper debug --scope back            # 仅后端
codinghelper debug --scope db              # 仅数据库
codinghelper debug -e "TypeError: xxx"     # 附带错误信息

# 8. 查看项目状态
codinghelper status

# 9. 启动 Web Dashboard
codinghelper dashboard
codinghelper dashboard --port 8080
```

> 需求输入建议用 `## 标题` 分隔功能模块，任务拆分会按 h2 标题自动切分。

## 可用模板

| 模板名 | 描述 |
|--------|------|
| `vue-express` | Vue 3 + Express + PostgreSQL 全栈项目 |
| `react-nestjs` | React 18 + NestJS + MySQL 全栈项目 |
| `vue-fastapi` | Vue 3 + FastAPI + PostgreSQL 全栈项目 |
| `react-express` | React 18 + Express + MongoDB 全栈项目 |
| `nuxt` | Nuxt 3 全栈项目（内置 Nitro 服务端） |
| `nextjs` | Next.js 14 全栈项目（App Router） |
| `express-api` | Express 纯后端 API 项目 |
| `fastapi` | FastAPI 纯后端 API 项目 |

## 命令参考

| 命令 | 说明 | 主要选项 |
|------|------|----------|
| `init` | 初始化项目配置 | `--template <name>` |
| `plan` | 需求分析，生成需求文档 | — |
| `spec` | 生成技术规范和 CLAUDE.md | `--regenerate` |
| `task` | 拆分需求为任务列表 | — |
| `run` | 执行下一个任务 | `--resume` `--dry-run` `--all` |
| `done` | 标记当前任务完成 | — |
| `status` | 查看项目进度 | — |
| `debug` | 生成调试指令 | `-s <scope>` `-e <error>` |
| `review` | 任务审查 | `-a` `-r` `-c <comment>` `-t <taskId>` |
| `dashboard` | 启动 Web 可视化面板 | `-p <port>` |

## 生成的文件结构

执行工作流后，项目目录下会生成：

```
.codinghelper/
├── config.json          # 项目配置（名称、技术栈等）
├── requirements.md      # 结构化需求文档
├── spec.md              # 技术规范（架构、目录、编码标准）
├── CLAUDE.md            # Claude Code 专用约束文件（动态注入任务/调试上下文）
├── tasks/
│   ├── index.json       # 任务索引与执行顺序
│   ├── task-001.md      # 任务详情与验收标准
│   ├── task-002.md
│   └── ...
└── logs/
    ├── history.json     # 任务执行历史记录
    ├── debug-*.json     # 调试分析日志
    └── review-*.json    # 审查记录
```

## 项目源码结构

```
CodingHelper/
├── packages/
│   ├── cli/                         # CLI 命令行工具
│   │   └── src/
│   │       ├── commands/            # CLI 命令实现
│   │       │   ├── init.ts              # 项目初始化
│   │       │   ├── plan.ts              # 需求分析
│   │       │   ├── spec.ts              # 规范生成
│   │       │   ├── task.ts              # 任务拆分
│   │       │   ├── run.ts               # 任务执行 / done / status
│   │       │   ├── debug.ts             # 调试分析
│   │       │   ├── review.ts            # 任务审查
│   │       │   └── dashboard.ts         # Web Dashboard 启动
│   │       ├── core/                # 核心引擎
│   │       │   ├── planner.ts           # 需求文档生成
│   │       │   ├── specGenerator.ts     # 技术规范生成
│   │       │   ├── specStrategies.ts    # 策略模式（按技术栈适配规范）
│   │       │   ├── taskSplitter.ts      # 任务拆分与依赖分析
│   │       │   ├── approvalManager.ts   # 审阅确认流程
│   │       │   ├── suggestionEngine.ts  # 技术栈推荐与需求分析
│   │       │   ├── claudeMdManager.ts   # CLAUDE.md 动态注入管理
│   │       │   ├── debugOrchestrator.ts # 调试指令生成
│   │       │   ├── historyManager.ts    # 执行历史记录
│   │       │   └── templates.ts         # 项目模板定义
│   │       ├── types/               # Zod schema 与类型定义
│   │       ├── utils/               # 工具函数（文件 I/O、终端显示等）
│   │       └── __tests__/           # 集成测试
│   ├── server/                      # Dashboard 后端 API
│   │   └── src/
│   │       ├── index.ts                 # 服务器入口
│   │       ├── routes.ts               # API 路由
│   │       └── dataReader.ts            # 项目数据读取
│   └── dashboard/                   # Dashboard 前端（Vue 3）
├── docs/
│   └── dev-guide.md                 # 开发文档
├── package.json                     # pnpm workspace 根配置
└── tsconfig.base.json               # 共享 TypeScript 配置
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
| Dashboard | Vue 3 + Fastify |
| 包管理 | pnpm (monorepo workspace) |

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试（122 个测试用例）
pnpm test

# 开发模式（监听文件变化）
cd packages/cli && pnpm dev
```

## 测试覆盖

| 模块 | 测试文件 | 用例数 |
|------|----------|--------|
| 类型 Schema | schemas.test.ts | 13 |
| 建议引擎 | suggestionEngine.test.ts | 20 |
| 规范生成 | specGenerator.test.ts | 11 |
| 任务拆分 | taskSplitter.test.ts | 10 |
| 调试编排 | debugOrchestrator.test.ts | 7 |
| CLAUDE.md 管理 | claudeMdManager.test.ts | 5 |
| 历史记录 | historyManager.test.ts | 6 |
| 模板 | templates.test.ts | 6 |
| 需求规划 | planner.test.ts | 5 |
| 任务审查 | review.test.ts | 11 |
| 文件工具 | fs.test.ts | 7 |
| 项目上下文 | projectContext.test.ts | 5 |
| 集成测试 | integration.test.ts | 3 |
| 数据读取 | dataReader.test.ts | 5 |
| API 路由 | routes.test.ts | 8 |

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
