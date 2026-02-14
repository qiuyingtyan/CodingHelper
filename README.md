# CodingHelper

AI 辅助编程工作流工具集 — 充当 Claude Code 的项目经理，将需求自动拆解为可执行的任务序列。提供 CLI、Web Dashboard 和共享核心库。

## 它解决什么问题

直接把大段需求丢给 AI 编码助手，往往得到零散、不连贯的结果。CodingHelper 在你和 Claude Code 之间加了一层结构化流程：

```
需求输入 → 需求文档 → 技术规范 → 任务拆分 → 逐个执行 → 调试 → 审查/完成
```

每个阶段都有审阅确认环节，确保方向正确后再进入下一步。

## 核心特性

- **6 阶段工作流** — init → plan → spec → task → run → debug，严格按序推进；另有 done / review / compact / status 等任务管理命令
- **智能技术栈推荐** — 内置主流前端、后端、数据库方案及配套建议
- **需求完整度分析** — 自动评分并给出改进建议，低于 40% 会阻断流程
- **策略模式规范生成** — 根据技术栈（Vue/React/Express/Django/FastAPI 等）自动适配目录结构、编码标准和测试策略
- **智能任务拆分** — 按 Markdown `## ` 标题切分需求，语义分析自动建立依赖关系
- **CLAUDE.md 动态管理** — 为 Claude Code 生成并动态注入任务上下文和调试指令
- **调试分析** — 按技术栈层级（前端/后端/数据库）生成针对性调试指令
- **任务审查** — 支持审批/驳回流程，记录审查历史
- **任务状态追踪** — pending → in_progress → completed / rejected，支持恢复中断任务
- **执行历史记录** — 自动记录所有任务操作（启动、完成、驳回、恢复）
- **历史自动压缩** — 当历史记录超过阈值时自动归档旧条目，保持文件精简
- **已完成任务摘要** — 自动将已完成任务摘要注入 CLAUDE.md，为后续任务提供上下文
- **手动压缩命令** — `compact` 命令支持按保留条数或天数清理历史和日志
- **领域错误体系** — 结构化错误类型（ConfigNotFound、TaskNotFound 等），提供清晰的错误提示
- **Repository 层** — 数据访问与业务逻辑分离，taskRepository / historyRepository / logRepository / configRepository
- **Application Services** — taskService / projectService 封装跨层业务流程
- **Server 分页支持** — Dashboard API 支持分页查询任务和历史记录
- **Server 工作流操作** — POST API 支持通过 Web 触发需求生成、规范生成和任务拆分
- **项目模板** — 8 套预设模板快速初始化（vue-express、react-nestjs、nextjs 等）
- **Web Dashboard** — 可视化面板查看项目状态和任务进度，支持工作流操作面板
- **共享核心库** — `@codinghelper/shared` 集中管理类型定义、规划器、规范策略、规范生成器和任务拆分器，CLI 和 Server 共用

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

# 8. 压缩历史记录
codinghelper compact              # 自动压缩（保留最近 50 条）
codinghelper compact --keep 20    # 保留最近 20 条
codinghelper compact --days 7     # 仅保留最近 7 天

# 9. 查看项目状态
codinghelper status

# 10. 启动 Web Dashboard
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
| `compact` | 压缩历史记录和日志 | `--keep <n>` `--days <n>` |
| `dashboard` | 启动 Web 可视化面板 | `-p <port>` |

## Server API

GET 端点（数据查询）：

| 端点 | 说明 |
|------|------|
| `GET /api/project` | 获取项目全量数据 |
| `GET /api/config` | 获取项目配置 |
| `GET /api/tasks` | 获取任务列表与执行顺序 |
| `GET /api/spec` | 获取技术规范文档 |
| `GET /api/requirements` | 获取需求文档 |
| `GET /api/logs` | 获取操作日志（支持 `limit` / `offset` 分页） |
| `GET /api/reviews` | 获取审查记录 |
| `GET /api/debug-logs` | 获取调试日志 |

POST 端点（工作流操作）：

| 端点 | 说明 | 请求体 |
|------|------|--------|
| `POST /api/generate-requirements` | 生成需求文档 | `{ requirements, config }` |
| `POST /api/generate-spec` | 生成技术规范和 CLAUDE.md | `{ requirements, config }` |
| `POST /api/split-tasks` | 拆分任务并生成依赖关系 | `{ requirements, config }` |

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
    ├── review-*.json    # 审查记录
    └── archive/         # 压缩归档的历史记录
```

## 项目源码结构

```
CodingHelper/
├── packages/
│   ├── shared/                      # 共享核心库 (@codinghelper/shared)
│   │   └── src/
│   │       ├── index.ts                 # 统一导出入口
│   │       ├── types.ts                 # Zod schema 与类型定义
│   │       ├── planner.ts               # 需求文档生成
│   │       ├── specGenerator.ts         # 技术规范 & CLAUDE.md 生成
│   │       ├── specStrategies.ts        # 策略模式（按技术栈适配规范）
│   │       └── taskSplitter.ts          # 任务拆分与依赖分析（Kahn 拓扑排序）
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
│   │       │   ├── compact.ts           # 历史压缩
│   │       │   └── dashboard.ts         # Web Dashboard 启动
│   │       ├── core/                # 核心引擎（从 @codinghelper/shared 重新导出）
│   │       │   ├── planner.ts           # → shared/planner
│   │       │   ├── specGenerator.ts     # → shared/specGenerator
│   │       │   ├── specStrategies.ts    # → shared/specStrategies
│   │       │   ├── taskSplitter.ts      # → shared/taskSplitter
│   │       │   ├── approvalManager.ts   # 审阅确认流程
│   │       │   ├── suggestionEngine.ts  # 技术栈推荐与需求分析
│   │       │   ├── claudeMdManager.ts   # CLAUDE.md 动态注入管理
│   │       │   ├── debugOrchestrator.ts # 调试指令生成
│   │       │   ├── historyManager.ts    # 执行历史记录与自动压缩
│   │       │   └── templates.ts         # 项目模板定义
│   │       ├── errors/             # 领域错误定义
│   │       │   └── domainErrors.ts      # 结构化错误类型
│   │       ├── repositories/       # 数据访问层
│   │       │   ├── taskRepository.ts    # 任务数据读写
│   │       │   ├── historyRepository.ts # 历史记录读写
│   │       │   ├── logRepository.ts     # 日志读写
│   │       │   └── configRepository.ts  # 配置读写
│   │       ├── services/           # 应用服务层
│   │       │   ├── taskService.ts       # 任务业务流程
│   │       │   └── projectService.ts    # 项目业务流程
│   │       ├── types/               # 类型定义（从 @codinghelper/shared 重新导出）
│   │       ├── utils/               # 工具函数（文件 I/O、终端显示等）
│   │       └── __tests__/           # 集成测试
│   ├── server/                      # Dashboard 后端 API
│   │   └── src/
│   │       ├── index.ts                 # 服务器入口
│   │       ├── routes.ts                # API 路由（GET 查询 + POST 工作流操作）
│   │       ├── actions.ts               # 服务器操作（生成需求/规范/任务拆分）
│   │       └── dataReader.ts            # 项目数据读取
│   └── dashboard/                   # Dashboard 前端（Vue 3 + Naive UI）
│       └── src/
│           ├── App.vue                    # 布局（侧边栏 + 路由视图）
│           ├── composables/
│           │   ├── useApi.ts              # 通用 GET 数据请求 composable
│           │   └── usePost.ts             # 通用 POST 请求 composable
│           └── views/
│               ├── Overview.vue           # 项目概览（统计卡片、进度、技术栈、工作流面板）
│               ├── Tasks.vue              # 任务列表（表格、执行顺序）
│               ├── Spec.vue               # 规范文档（技术规范 + 需求文档 Tab）
│               ├── DebugLogs.vue          # 调试日志（按 scope 分类、findings 列表）
│               ├── Reviews.vue            # 审查记录（状态标签、分页表格）
│               └── Logs.vue               # 操作日志（类型检测、折叠面板）
├── docs/
│   └── dev-guide.md                 # 开发文档
├── package.json                     # pnpm workspace 根配置
└── tsconfig.base.json               # 共享 TypeScript 配置
```

## 技术栈

| 类别 | 选型 |
|------|------|
| 语言 | TypeScript (strict mode, ESM) |
| 共享核心库 | @codinghelper/shared（类型、规划器、规范策略、任务拆分） |
| CLI 框架 | Commander.js |
| 交互提示 | @inquirer/prompts |
| 数据校验 | Zod |
| 构建工具 | tsup（CLI / Server / Shared）、Vite（Dashboard） |
| 测试框架 | Vitest |
| Dashboard | Vue 3 + Naive UI + Vue Router |
| Dashboard 服务 | Express + CORS |
| 代码规范 | ESLint 9 + Prettier + typescript-eslint 8 |
| 包管理 | pnpm (monorepo workspace) |

## 开发

```bash
# 安装依赖
pnpm install

# 构建全部包（按依赖顺序：shared → cli / server / dashboard）
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 开发模式（监听文件变化）
cd packages/cli && pnpm dev
```

## 包依赖关系

```
@codinghelper/shared  ← 核心业务逻辑（类型、规划器、规范、任务拆分）
    ↑           ↑
    │           │
@codinghelper/cli   @codinghelper/server  ← 重新导出 shared / 调用 shared
                        ↑
                        │
                @codinghelper/dashboard  ← 通过 API 调用 server
```

## 测试覆盖

CLI 包（207 用例，33 个测试文件）：

| 分类 | 测试文件 | 说明 |
|------|----------|------|
| 核心引擎 | planner, suggestionEngine, specGenerator, specStrategies, taskSplitter, debugOrchestrator, claudeMdManager, historyManager, compactHistory, completedSummary, templates, approvalManager | 需求分析、规范生成、任务拆分、调试、历史管理等 |
| 命令 | init, plan, spec, task, run, debug, review, compact | 全部 8 个 CLI 命令 |
| Repository | taskRepository, historyRepository, logRepository, configRepository | 数据访问层 |
| Service | taskService, projectService | 应用服务层 |
| 工具 | fs, projectContext, display, phaseGuard | 文件 I/O、上下文、显示、阶段守卫 |
| 类型 | schemas | Zod schema 验证 |
| 错误 | domainErrors | 领域错误类型 |
| 集成 | integration | 端到端流程 |

Server 包（21 用例，3 个测试文件）：

| 测试文件 | 说明 |
|----------|------|
| dataReader | 全量数据读取 |
| dataReaderIndividual | 按需读取与分页 |
| routes | API 路由端点 |

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
