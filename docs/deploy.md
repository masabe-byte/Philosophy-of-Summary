# 部署清单

## 1. Supabase

先在 Supabase SQL Editor 执行：

```text
docs/cloud-sync.sql
```

表名：`summary_habit_records`

如果没有执行，页面会显示云端表未建，接口会返回 `PGRST205`。

## 2. GitHub

建议仓库名：

```text
masabe-byte/Philosophy-of-Summary
```

本地已经是 git 仓库，当前分支为 `main`。

如果 GitHub CLI 可用：

```bash
gh auth login -h github.com
gh repo create masabe-byte/Philosophy-of-Summary --public --source . --remote origin --push
```

如果不用 GitHub CLI，也可以在 GitHub 网页创建空仓库后运行：

```bash
git remote add origin https://github.com/masabe-byte/Philosophy-of-Summary.git
git push -u origin main
```

## 3. Vercel

在 Vercel 导入 GitHub 仓库即可。

本项目不需要配置模型 API Key 环境变量：

- 模型供应商、Key、baseUrl 由远程模型选择器服务读取。
- 本项目只保存 `selectionReference`。
- Vercel 项目里不需要 `SUPABASE_SERVICE_ROLE_KEY`。

部署后检查：

1. 页面可打开。
2. 顶部模型按钮能打开模型选择器。
3. 导入 TSV/CSV/Markdown 片段正常。
4. 未通过评分时不能进入下一段。
5. 强制跳过可以进入下一段，并留下记录。
6. 参考答案默认隐藏。
7. Supabase 存档可刷新、打开、删除。

## 4. 本地验收

```bash
npm run check
npm run dev
```

默认端口从 `4177` 开始。
