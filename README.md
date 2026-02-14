# CodingHelper

AI 编程助手的项目经理 — 把你的需求自动拆解成一步步的任务，交给 Claude Code 执行。

## 这是什么

写代码时直接把一大段需求丢给 AI，结果往往零散、不连贯。CodingHelper 帮你把需求变成结构化的工作流：

```
初始化 → 写需求 → 生成规范 → 拆分任务 → 逐个执行 → 调试
```

每一步都可以审阅确认，确保方向对了再往下走。

## 安装

```bash
git clone <repo-url> && cd CodingHelper
pnpm install && pnpm build

# 全局使用（可选）
cd packages/cli && pnpm link --global
```

## 使用

```bash
cd your-project

codinghelper init                  # 初始化项目，选择技术栈
codinghelper plan                  # 输入需求，生成需求文档
codinghelper spec                  # 根据需求生成技术规范
codinghelper task                  # 把需求拆成可执行的任务
codinghelper run                   # 开始执行下一个任务
codinghelper done                  # 标记当前任务完成
codinghelper debug                 # 遇到问题时生成调试建议
codinghelper review                # 审查已完成的任务
codinghelper status                # 查看项目进度
codinghelper dashboard             # 启动 Web 可视化面板
```

> 写需求时建议用 `## 标题` 分隔功能模块，任务拆分会按标题自动切分。

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
