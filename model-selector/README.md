# Model Selector

如果你只想看最短接入说明，先打开 [docs/quick-start.md](docs/quick-start.md)。

后续项目接入时，优先看这份可复制的建造说明：

```text
docs/project-integration-guide.md
```

一个给个人项目复用的模型接入组件。它不做中央中转站，不替业务项目代理请求；它只负责管理统一的 API 分组、登录读取配置、选择模型，并把业务项目真正需要保存的“选择引用”交出去。

## 给其他项目的接入说明

如果你要把它嵌进新项目，最先看这两份：

- [快速接入](docs/quick-start.md)
- [完整交接说明](docs/project-integration-guide.md)

新项目不需要去 Supabase 后台手工新建表，也不需要每次换模型就复制一份代码。它只要：

1. 复制 `model-selector/` 目录
2. 传入自己的 `projectId` 和稳定的 `projectCode`
3. 保存一份 `selectionReference`
4. 真正调用模型时读取 `selector.getActiveConfig()`

自动切换策略也写在 `selectionReference` 里，不是另起一套配置。

## 边界

Supabase 只保存统一的模型接入信息：

- API 分组，例如 `通用`、`备用`、`本地`
- 各厂商的 API Key、Base URL、账号编号等
- 可选的默认选择槽位

业务项目自己的数据库只保存选择引用，不保存 API Key：

```json
{
  "version": 1,
  "projectCode": "model_selector_planning-Ab12C",
  "libraryId": "common",
  "provider": "openrouter",
  "keyAlias": "1",
  "model": "openai/gpt-5.4",
  "strategy": "primary",
  "modelParams": {
    "temperature": 1,
    "top_p": 1,
    "max_tokens": 2048
  },
  "updatedAt": "2026-05-27T00:00:00.000Z"
}
```

这份引用表达的是“这个项目当前使用云端统一配置里的哪一组、哪个厂商、哪个账号编号、哪个模型”。真正的 API Key 只有用户登录 Supabase 后才能读取。

## 嵌入方式

推荐用浮窗。业务页面只留一个右下角入口，用户需要切模型时再打开。

```html
<link rel="stylesheet" href="/model-selector/src/model-selector.css">

<script type="module">
  import { connectFloatingModelSelector } from "/model-selector/src/connect-model-selector.js";

  const savedReference = await loadFromYourProjectDatabase();

  const selector = await connectFloatingModelSelector({
    projectId: "planning",
    projectCode: "model_selector_planning-Ab12C",
    selectionReference: savedReference,
    onChange(activeConfig) {
      if (!activeConfig) return;
      saveToYourProjectDatabase(activeConfig.selectionReference);
    }
  });

  const config = selector.getActiveConfig();
</script>
```

如果你希望把选择器嵌入某个固定区域，也可以使用面板模式：

```html
<link rel="stylesheet" href="/src/model-selector.css">
<div id="modelSelector"></div>

<script type="module">
  import { connectModelSelector } from "/src/connect-model-selector.js";

  const savedReference = await loadFromYourProjectDatabase();

  const selector = await connectModelSelector({
    target: "#modelSelector",
    projectId: "planning",
    projectCode: "model_selector_planning-Ab12C",
    selectionReference: savedReference,
    onChange(activeConfig) {
      if (!activeConfig) return;
      saveToYourProjectDatabase(activeConfig.selectionReference);
      console.log(activeConfig);
    }
  });

  const config = selector.getActiveConfig();
</script>
```

`activeConfig` 才包含运行时调用模型需要的信息：

```json
{
  "projectId": "planning",
  "projectCode": "model_selector_planning-Ab12C",
  "libraryId": "common",
  "provider": "openrouter",
  "providerLabel": "OpenRouter",
  "model": "openai/gpt-5.4",
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "sk-xxx",
  "headers": {},
  "extra": {},
  "modelAvailable": true,
  "modelCacheSource": "live",
  "modelCacheUpdatedAt": "2026-05-28T00:00:00.000Z",
  "selectionReference": {}
}
```

业务项目可以用它直接调用模型，但不要把 `apiKey` 写入自己的数据库。只保存 `selectionReference`。

需要一个最小调用器时，可以复用内置 helper：

```js
import { chatWithActiveConfig, getAssistantText } from "/src/model-selector.js";

const payload = await chatWithActiveConfig(config, {
  messages: [{ role: "user", content: "你好" }],
  temperature: 0.3
});

const text = getAssistantText(payload);
```

业务项目仍然负责自己的提示词、业务状态和结果解析。

## 浮窗 API

`connectFloatingModelSelector()` 返回的对象兼容普通选择器，并额外提供：

```js
selector.open();
selector.close();
selector.toggle();
selector.isOpen();
selector.destroy();
```

`onChange(activeConfig)` 只在业务项目需要保存的 `selectionReference` 真实变化时触发。刷新模型名单、打开面板、查看引用这类动作不会反复通知业务项目写库。
`onRuntimeChange(activeConfig)` 只用于刷新模型名单、可用性变化后的界面状态更新，不要在这里保存 `selectionReference`。

可选参数：

```js
await connectFloatingModelSelector({
  projectId: "planning",
  projectCode: "model_selector_planning-Ab12C",
  selectionReference,
  defaultOpen: false,
  position: "bottom-right", // 或 bottom-left
  buttonText: "AI",
  title: "模型配置",
  subtitle: "选择 API 分组和模型",
  providerIconBaseUrl: "/assets/provider-icons/"
});
```

`projectCode` 是业务项目在共享数据库里的隔离标识。推荐格式是
`model_selector_项目名-5位大小写数字`，例如 `model_selector_planning-Ab12C`。
如果业务项目没有传入，选择器会在第一次启动时自动生成并保存；之后新增项目不需要再去 Supabase 后台手动建表或建记录。

## Supabase

默认模式下，前端只使用 Supabase URL 和 publishable key。不要把 service role 或 Supabase secret key 放进浏览器代码。

先在 Supabase SQL Editor 运行：

```sql
-- docs/supabase-schema.sql
```

然后在 Supabase Auth 里创建自己的邮箱密码账号，用来作为 `MODEL_SELECTOR_OWNER_ID` 对应的所有者。其他业务项目不需要登录这个 Supabase。

### 免登录个人模式

其他业务项目必须使用服务端免登录模式。注意：service role 仍然不能进浏览器，只能放在 Vercel / Node 服务端环境变量里。

需要在承载模型选择器接口的项目里配置：

```text
SUPABASE_URL=https://vcixggayhuzrjpzutnkz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role / secret key
MODEL_SELECTOR_OWNER_ID=你的 Supabase Auth 用户 uuid
MODEL_SELECTOR_ACCESS_TOKEN=一串很长的随机访问密码
```

然后其他业务项目接入时传入：

```js
const selector = await connectFloatingModelSelector({
  projectId: "planning",
  projectCode: "model_selector_planning-Ab12C",
  selectionReference: savedReference,
  stateEndpoint: "https://你的模型选择器域名/api/selector-state",
  modelsEndpoint: "https://你的模型选择器域名/api/models",
  modelSelectorAccessToken: "MODEL_SELECTOR_ACCESS_TOKEN 那串随机密码",
  onChange(activeConfig) {
    saveToYourProjectDatabase(activeConfig.selectionReference);
  }
});
```

这样业务项目不需要登录 Supabase。网页只请求你自己的 `stateEndpoint`，真正的 service key 留在服务端。

`MODEL_SELECTOR_ACCESS_TOKEN` 用来保护 `/api/selector-state` 和 `/api/models`。服务端设置后，没有携带 token 的请求会返回 404，尽量不暴露接口存在。

如果业务项目和模型选择器接口部署在同一个项目里，`stateEndpoint` 可以省略，默认会使用同域的 `/api/selector-state`。如果业务项目只是远程嵌入打包版选择器，建议显式填写完整 URL。

## 本地运行

```bash
npm run dev
```

打开 `http://localhost:4173`。

## 测试业务项目

仓库里带了一个极小的问答项目，用来模拟其他项目如何嵌入选择器：

```text
http://localhost:4173/test-project/
```

这个项目只有问答功能。它自己的模拟数据库只保存 `selectionReference` 和聊天记录；fake cloud 模拟 Supabase，只保存统一 API 分组和密钥配置。

本地密钥 seed 文件是：

```text
test-project/fake-cloud.local.js
```

它已被 `.gitignore` 忽略，不会提交。没有这个文件时，测试项目会退回到不含密钥的 example seed。

## Vercel

这个仓库是静态页面加 `/api/models` serverless function。模型厂商 API Key 在网页里填写，并保存到 Supabase 的 `model_selector_state` 表。RLS 会限制只有当前登录用户能读写自己的配置。

不需要为模型厂商 API Key 配置 Vercel 环境变量。

## 字段规则

- Key 和 token 在 UI 中明文显示，方便个人复制。
- 字段默认只读，点击字段旁边的“修改”后才允许编辑。
- `selectionReference` 不含任何密钥，可以安全保存到业务项目数据库。
- `activeConfig` 含密钥，只用于当前登录会话的运行时调用。

## 支持的厂商

- OpenRouter
- Groq
- DeepSeek
- Gemini
- GLM / Zhipu
- Cerebras
- Cloudflare Workers AI
- Qwen / DashScope
- Requesty
- Portkey
- Custom OpenAI-compatible endpoint
- Local OpenAI-compatible endpoint
