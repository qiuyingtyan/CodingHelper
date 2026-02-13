# CodingHelper 开发文档

## 一、产品概述

**定位：** 面向个人开发者的 CLI 工具，搭配 Claude Code 实现全自动开发。

**核心价值：** 将"人驱动 AI 写代码"升级为"AI 自主规划 + 自动编码 + 自动调试"，用户只需审批关键节点。

**一句话描述：** CodingHelper 是 Claude Code 的项目经理——它负责规划、拆分、生成指令，Claude Code 负责执行。

## 二、系统架构

```
┌─────────────────────────────────────────────┐
│                  用户                        │
│         CLI 交互 / Web Dashboard            │
└──────────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼──────┐ ┌────▼────────────┐
    │  CLI Core   │ │  Vue Dashboard  │
    │  (Node.js)  │ │  (本地 :3120)   │
    └──────┬──────┘ └────┬────────────┘
           │              │
    ┌──────▼──────────────▼───────────┐
    │        核心引擎 (Core)           │
    │  ┌───────────┐ ┌─────────────┐  │
    │  │ 需求分析器 │ │ 规范生成器   │  │
    │  └───────────┘ └─────────────┘  │
    │  ┌───────────┐ ┌─────────────┐  │
    │  │ 任务拆分器 │ │ 调试编排器   │  │
    │  └───────────┘ └─────────────┘  │
    │  ┌───────────┐ ┌─────────────┐  │
    │  │ 审批管理器 │ │ 状态追踪器   │  │
    │  └───────────┘ └─────────────┘  │
    └──────────────┬──────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │      文件生成层 (Output)         │
    │  CLAUDE.md / tasks/ / spec.md   │
    └──────────────┬──────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │        Claude Code 执行          │
    │   读取配置 → 自动编码 → 自动调试  │
    └─────────────────────────────────┘
```

## 三、核心工作流（6 阶段）

### 阶段 1: 项目初始化 (`codinghelper init`)

- 交互式收集：项目名、描述、技术栈、目标平台
- 创建 `.codinghelper/` 目录结构
- 生成初始 `config.json`

### 阶段 2: 需求沟通 (`codinghelper plan`)

- AI 与用户多轮对话，逐步明确需求
- 支持需求模板（Web 应用、API 服务、全栈项目等）
- 产出：`.codinghelper/requirements.md`
- 门控：用户确认需求后进入下一阶段

### 阶段 3: 规范生成 (`codinghelper spec`)

- AI 根据需求 + 技术栈自动生成：
  - `CLAUDE.md`（Claude Code 约束文件）
  - `.codinghelper/spec.md`（技术规范：架构、目录结构、命名规范、错误处理策略）
- 门控：用户审批规范

### 阶段 4: 任务拆分 (`codinghelper task`)

- AI 将需求拆分为有序的小任务
- 每个任务包含：描述、依赖关系、验收标准、涉及文件
- 自动排序：按依赖关系生成执行顺序
- 产出：`.codinghelper/tasks/task-XXX.md`
- 门控：用户审批任务列表

### 阶段 5: 自动编码 (`codinghelper run [task-id]`)

- 为指定任务生成专属的 Claude Code 执行指令
- 将任务上下文、约束、依赖信息注入 CLAUDE.md
- 用户在 Claude Code 中执行，完成后回来标记状态
- 支持 `codinghelper run --all` 按顺序执行所有待办任务

### 阶段 6: 自动调试 (`codinghelper debug`)

- 检测项目运行状态，生成调试指令
- 三层联调：前端 ↔ 后端 ↔ 数据库
- 生成包含错误日志分析、接口对比、数据流追踪的调试 CLAUDE.md
- 用户在 Claude Code 中执行调试指令

### 贯穿全程: Review (`codinghelper review [task-id]`)

- 随时查看任意任务的完成情况
- 查看代码变更摘要
- 标记任务状态（通过/需修改/驳回）

## 四、CLI 命令设计

| 命令 | 说明 | 关键参数 |
|------|------|----------|
| `codinghelper init` | 初始化项目 | `--template <type>` |
| `codinghelper plan` | 需求沟通 | `--resume` 继续上次对话 |
| `codinghelper spec` | 生成规范 | `--regenerate` 重新生成 |
| `codinghelper task` | 任务拆分 | `--list` 查看所有任务 |
| `codinghelper run [id]` | 执行任务 | `--all` 执行全部, `--dry-run` 预览 |
| `codinghelper debug` | 自动调试 | `--scope <front/back/db/all>` |
| `codinghelper review [id]` | 审查任务 | `--approve`, `--reject` |
| `codinghelper status` | 项目总览 | 无 |
| `codinghelper dashboard` | 打开 Web 面板 | `--port <number>` |

## 五、生成文件规范

### 目录结构

```
project-root/
├── CLAUDE.md                      # Claude Code 主约束文件
└── .codinghelper/
    ├── config.json                # 项目配置
    ├── requirements.md            # 需求文档
    ├── spec.md                    # 技术规范
    ├── tasks/
    │   ├── index.json             # 任务索引（顺序、依赖、状态）
    │   ├── task-001.md            # 单个任务详情
    │   ├── task-002.md
    │   └── ...
    └── logs/
        ├── debug-<timestamp>.md   # 调试日志
        └── review-<timestamp>.md  # 审查记录
```

### CLAUDE.md 生成模板要点

- 项目约束（技术栈、编码规范、目录结构）
- 当前任务上下文（执行 `run` 时动态注入）
- 调试指令（执行 `debug` 时动态注入）
- 验收标准

### 任务文件格式 (task-XXX.md)

- 任务 ID、标题、状态
- 描述与验收标准
- 依赖任务列表
- 涉及的文件路径
- Claude Code 执行指令

## 六、数据模型

### config.json

```json
{
  "projectName": "",
  "description": "",
  "techStack": {
    "frontend": "",
    "backend": "",
    "database": ""
  },
  "createdAt": "",
  "currentPhase": "init | plan | spec | task | run | debug",
  "version": "1.0.0"
}
```

### tasks/index.json

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "",
      "status": "pending | in_progress | completed | rejected",
      "dependencies": [],
      "priority": 1,
      "createdAt": "",
      "completedAt": null
    }
  ],
  "executionOrder": ["task-001", "task-002"]
}
```

## 七、Web Dashboard 设计（Vue 3）

通过 `codinghelper dashboard` 启动本地服务，浏览器访问。

### 核心页面

1. **项目总览** - 当前阶段、任务进度、统计数据
2. **需求文档** - 查看/编辑需求
3. **任务看板** - 看板视图展示所有任务状态，支持拖拽排序
4. **任务详情** - 查看单个任务、审批操作
5. **调试面板** - 查看调试日志、错误追踪
6. **配置管理** - 编辑项目配置和规范

### 技术选型

- Vue 3 + Vite
- Pinia 状态管理
- Vue Router
- 组件库：Naive UI（轻量且风格克制）
- 后端：Express 提供 REST API，读写 `.codinghelper/` 目录文件

## 八、技术栈与项目结构

```
C:\CodingHelper\
├── packages/
│   ├── cli/                       # CLI 工具
│   │   ├── src/
│   │   │   ├── commands/          # 命令实现
│   │   │   ├── core/              # 核心引擎
│   │   │   │   ├── planner.ts     # 需求分析
│   │   │   │   ├── specGenerator.ts   # 规范生成
│   │   │   │   ├── taskSplitter.ts    # 任务拆分
│   │   │   │   ├── debugOrchestrator.ts # 调试编排
│   │   │   │   └── approvalManager.ts  # 审批管理
│   │   │   ├── generators/        # 文件生成器
│   │   │   ├── templates/         # CLAUDE.md 等模板
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── server/                    # Dashboard 后端
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── package.json
│   └── dashboard/                 # Vue Dashboard
│       ├── src/
│       │   ├── views/
│       │   ├── components/
│       │   ├── stores/
│       │   └── router/
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### 依赖选型

| 用途 | 选型 |
|------|------|
| 包管理 | pnpm workspace (monorepo) |
| CLI 框架 | Commander.js |
| 交互式提示 | Inquirer.js |
| 前端 | Vue 3 + Vite + Pinia + Naive UI |
| 后端 | Express + TypeScript |
| 构建 (CLI) | tsup |
| 构建 (Dashboard) | Vite |
| 测试 | Vitest |

## 九、开发阶段规划

### P0 - 核心 CLI（MVP）

- `init`, `plan`, `spec`, `task`, `run`, `status` 命令
- CLAUDE.md 和任务文件生成
- 基本的交互式审批流程

### P1 - 调试与审查

- `debug` 命令：三层联调指令生成
- `review` 命令：任务审查和状态管理

### P2 - Web Dashboard

- 本地 Vue Dashboard
- 项目总览、任务看板、审批操作
- 实时文件监听同步状态

### P3 - 体验优化

- 项目模板库（Web 应用、API 服务等）
- 任务执行历史和回滚
- 更智能的调试分析

## 十、验证方案

- **单元测试：** Vitest，覆盖核心引擎逻辑（≥ 80%）
- **集成测试：** 模拟完整工作流（init → plan → spec → task → run）
- **E2E 验证：** 用 CodingHelper 自身来开发一个示例项目，验证全流程
- **生成文件验证：** 确保生成的 CLAUDE.md 能被 Claude Code 正确解析和执行
