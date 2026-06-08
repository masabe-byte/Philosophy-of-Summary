# 怎么总结

一个用于建立“一句话总结”习惯的 Vercel 网页应用。

目标不是训练漂亮中心思想，而是训练：读完一段材料后，主动写一句可复核、可调用、能服务下一步判断的总结。

## 功能

- 粘贴导入或上传 `.txt/.tsv/.csv/.md`
- 支持 Anki 式 `标题<Tab>正文<Tab>参考答案`
- 支持多行 CSV：`标题,正文,参考答案`
- 逐段阅读和一句话总结输入
- AI 评分，不通过不能进入下一段
- 只有至少一次真实评分未通过后，才允许强制跳过
- 参考答案默认隐藏
- 复用远程模型选择器
- 使用 Supabase 表 `summary_habit_records` 做云端存档
- React + Tailwind 桌面端界面，视觉语言参考 Claude 的温和纸面感

## 本地运行

```bash
npm run dev
```

默认使用 Vite 启动在 `http://127.0.0.1:4177/`。

生产构建：

```bash
npm run build
```

## Supabase

如果云端提示表未建，在 Supabase SQL Editor 执行：

```text
docs/cloud-sync.sql
```

业务项目只保存 `selectionReference`，不会保存 API Key 或完整模型配置。

## Vercel

本项目自身不需要配置模型 API Key 环境变量。

- 模型、Key、供应商配置由远程模型选择器服务读取。
- 本项目只把 `selectionReference` 保存进本地状态和 `summary_habit_records.state.settings`。
- 如果部署后云端存档不可用，优先检查是否已执行 `docs/cloud-sync.sql`。
