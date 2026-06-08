# Model Selector 项目接入建造说明

## 先看结论

新项目接入时，不需要每次换模型就复制一遍代码。  
正确做法是：

1. 把 `model-selector/` 作为可复用目录放进新项目
2. 新项目只保存一份 `selectionReference`
3. 选择器在网页里读取云端统一 API 库，业务项目只管自己的调用和结果解析
4. 模型、Key、自动切换策略都通过选择器页面改，改完只更新该项目自己的 `selectionReference`

换句话说，复制的是“选择器代码 + 接入方式”，不是“每换一次模型再复制一次”。

## 构建说明

给后续项目的最小构建步骤如下：

1. 复制本仓库的 `model-selector/` 目录到业务项目里
2. 在业务项目页面里引入：

```html
<link rel="stylesheet" href="/model-selector/src/model-selector.css">
<script type="module">
  import { connectFloatingModelSelector } from "/model-selector/src/connect-model-selector.js";
</script>
```

3. 在业务项目数据库里准备一个 JSON 字段保存 `selectionReference`
4. 初始化时把业务项目里已有的 `selectionReference` 传给选择器
5. 监听 `onChange(activeConfig)`，只保存 `activeConfig.selectionReference`
6. 真正发请求时，用 `selector.getActiveConfig()` 取运行时配置，不要保存它

如果业务项目也需要自动切换，就在请求层按 `activeConfig.selectionReference.strategy` 和 `fallbacks` 自己执行链路。

这份文档是给后续业务项目使用的。目标是：新项目只复制选择器代码或引入选择器目录，就能接入统一的模型选择能力；业务项目只保存自己的选择引用，不保存完整 API Key。

## 一句话原则

Model Selector 负责：

- 登录后读取统一 API 库
- 管理供应商、Key alias、模型列表和模型参数
- 生成业务项目可保存的 `selectionReference`
- 提供当前会话可用的 `activeConfig`

业务项目负责：

- 保存自己的 `selectionReference`
- 写自己的提示词、业务状态和结果解析
- 用 `activeConfig` 调用模型
- 不把 API Key 写进业务项目数据库

## 新项目必须准备什么

每个业务项目只需要准备 4 件事：

1. 一个稳定的 `projectId`
2. 一个稳定的 `projectCode`
3. 一个能保存 JSON 的字段，用来保存 `selectionReference`
4. 一个调用模型的位置，使用选择器返回的 `activeConfig`

推荐命名：

```text
projectId: planning
projectCode: model_selector_planning-Ab12C
```

`projectCode` 格式：

```text
model_selector_项目名-5位大小写字母或数字
```

如果业务项目没有传入 `projectCode`，选择器会首次自动生成并保存。为了不同项目长期稳定、不同设备可识别，推荐业务项目自己固定传入。

## 业务项目数据库要存什么

业务项目只存一份 `selectionReference`。它可以存在任意数据库里：Supabase、SQLite、Postgres、MySQL、IndexedDB 都可以，只要能保存 JSON。

建议字段：

```sql
model_selection_reference jsonb
```

如果数据库不支持 JSON 字段，就保存为 `text`，内容是 JSON 字符串。

如果业务项目用 `text` 字段保存，可以直接复用选择器提供的小工具：

```js
import {
  parseSelectionReference,
  serializeSelectionReference
} from "/model-selector/src/model-selector.js";

const savedText = await loadSelectionTextFromProjectDb();
const savedReference = parseSelectionReference(savedText);

await saveSelectionTextToProjectDb(
  serializeSelectionReference(activeConfig.selectionReference)
);
```

示例：

```json
{
  "version": 1,
  "projectCode": "model_selector_planning-Ab12C",
  "libraryId": "common",
  "provider": "openrouter",
  "keyAlias": "1",
  "model": "openai/gpt-oss-120b:free",
  "strategy": "primary",
  "modelParams": {
    "temperature": 1,
    "max_tokens": 4096,
    "reasoning_effort": "high"
  },
  "updatedAt": "2026-05-29T00:00:00.000Z"
}
```

不要保存：

- `apiKey`
- `apiToken`
- `Authorization`
- 完整供应商配置
- 完整 API 库

## 最小浮窗接入

业务页面引入 CSS 和浮窗连接器：

```html
<link rel="stylesheet" href="/model-selector/src/model-selector.css">

<script type="module">
  import { connectFloatingModelSelector } from "/model-selector/src/connect-model-selector.js";

  const savedReference = await loadSelectionReferenceFromProjectDb();

  const selector = await connectFloatingModelSelector({
    projectId: "planning",
    projectCode: "model_selector_planning-Ab12C",
    selectionReference: savedReference,
    defaultOpen: false,
    // 其他业务项目统一走免登录个人模式：让业务项目访问模型选择器服务端。
    // 如果这两个接口就在同域，可以省略，默认使用 /api/selector-state 和 /api/models。
    stateEndpoint: "https://pn4w9qze.vercel.app/api/selector-state",
    modelsEndpoint: "https://pn4w9qze.vercel.app/api/models",
    modelSelectorAccessToken: "202306313",
    buttonText: "模型",
    onChange(activeConfig) {
      if (!activeConfig?.selectionReference) return;
      saveSelectionReferenceToProjectDb(activeConfig.selectionReference);
    },
    onRuntimeChange(activeConfig) {
      updateAiStatus(activeConfig);
    }
  });

  window.appModelSelector = selector;
</script>
```

`onChange` 只在业务项目需要保存的新引用发生变化时触发。

`onRuntimeChange` 用于刷新模型列表、模型可用性变化、Key 状态变化后的界面提示，不建议在这里写库。

## 调用模型

选择器不接管业务提示词。业务项目需要自己组织 messages。

可以使用内置 helper：

```js
import {
  chatWithActiveConfig,
  getAssistantText
} from "/model-selector/src/model-selector.js";

async function askAi(userText) {
  const config = window.appModelSelector.getActiveConfig();

  const payload = await chatWithActiveConfig(config, {
    messages: [
      { role: "system", content: "你是当前项目的助手，按本项目规则回答。" },
      { role: "user", content: userText }
    ]
  });

  return getAssistantText(payload);
}
```

业务项目也可以不用内置 helper，自己根据 `activeConfig` 调用。

## 失败自动切换

选择器会把策略和备用模型链写进 `selectionReference`：

- `strategy: "fixed"`：失败就停止
- `strategy: "primary"`：只使用当前模型
- `strategy: "fallback"`：当前模型失败后，按 `fallbacks` 顺序尝试

业务项目如果使用内置 helper，可以这样执行备用链：

```js
import {
  chatWithActiveConfig,
  classifyModelRequestError,
  getAssistantText
} from "/model-selector/src/model-selector.js";

async function askAiWithFallback(messages) {
  const primary = window.appModelSelector.getActiveConfig();
  const fallbacks = primary.selectionReference?.strategy === "fallback"
    ? window.appModelSelector.getFallbackConfigs()
    : [];
  const chain = [primary, ...fallbacks].filter(Boolean);
  const failed = [];

  for (const config of chain) {
    try {
      const payload = await chatWithActiveConfig(config, { messages });
      return getAssistantText(payload);
    } catch (error) {
      failed.push(config);
      const next = chain[failed.length];
      if (next) {
        showToast(`${failed.map((item) => item.model).join("、")} 模型失败，已自动切换至 ${next.model} 模型。`);
      } else {
        const classified = classifyModelRequestError(error);
        throw new Error(`${failed.map((item) => item.model).join("、")} 模型都失败：${classified.message}`);
      }
    }
  }
}
```

自动切换只改变请求链路，不会把 API Key 写入业务项目数据库。业务项目仍然只保存 `selectionReference`。

`activeConfig` 会包含：

```json
{
  "projectId": "planning",
  "projectCode": "model_selector_planning-Ab12C",
  "libraryId": "common",
  "provider": "openrouter",
  "providerLabel": "OpenRouter",
  "keyAlias": "1",
  "model": "openai/gpt-oss-120b:free",
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "sk-xxx",
  "headers": {},
  "params": {},
  "paramEnabled": {},
  "selectionReference": {}
}
```

`activeConfig` 允许在当前运行时使用，但不要写入业务项目数据库。

## Supabase 共用方式

当前方向是一个 Supabase 存所有 Model Selector 数据，不为每个业务项目新建表。

Supabase 里保存：

- API 库
- 供应商配置
- Key alias
- 模型缓存
- 选择器自己的状态

业务项目自己的数据库保存：

- 当前项目选了哪个库
- 当前项目选了哪个供应商
- 当前项目选了哪个 Key alias
- 当前项目选了哪个模型
- 当前项目启用了哪些模型参数

也就是只保存 `selectionReference`。

新增业务项目时，不需要去 Supabase 后台新建表或新建记录。只要业务项目传入自己的 `projectId` / `projectCode`，选择器会在读取和保存状态时自动合并。

## 免登录个人模式

其他业务项目任何情况下都不需要登录模型选择器 Supabase。不要把 Supabase service role / secret key 写到前端。正确做法是：把 service key 放在模型选择器服务端，由业务项目调用模型选择器服务端接口。

模型选择器服务端需要配置：

```text
SUPABASE_URL=https://vcixggayhuzrjpzutnkz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 service role / secret key
MODEL_SELECTOR_OWNER_ID=你的 Supabase Auth 用户 uuid
MODEL_SELECTOR_ACCESS_TOKEN=一串很长的随机访问密码
```

`MODEL_SELECTOR_OWNER_ID` 是那条 `model_selector_state.user_id` 对应的用户 uuid。因为当前表结构有 `auth.users(id)` 外键，所以这个用户需要真实存在。

业务项目接入时传：

```js
const selector = await connectFloatingModelSelector({
  projectId: "planning",
  projectCode: "model_selector_planning-Ab12C",
  selectionReference: savedReference,
  stateEndpoint: "https://pn4w9qze.vercel.app/api/selector-state",
  modelsEndpoint: "https://pn4w9qze.vercel.app/api/models",
  modelSelectorAccessToken: "202306313",
  onChange(activeConfig) {
    saveSelectionReferenceToProjectDb(activeConfig.selectionReference);
  }
});
```

这样业务项目不需要登录 Supabase，也不需要知道 service key。它只访问：

```text
GET/POST /api/selector-state
POST /api/models
```

这不是 AI 请求中转站；它只负责读取模型选择器配置和刷新模型列表，真正聊天请求仍然由业务项目自己发。

设置 `MODEL_SELECTOR_ACCESS_TOKEN` 后，`/api/selector-state` 和 `/api/models` 都会要求请求头 `X-Model-Selector-Token`。没有 token 或 token 不对时返回 404。

## 复制到新项目时的目录约定

推荐放置：

```text
your-project/
  model-selector/
    src/
    assets/
    lib/
    api/
    docs/
```

业务项目页面使用：

```html
<link rel="stylesheet" href="/model-selector/src/model-selector.css">
<script type="module">
  import { connectFloatingModelSelector } from "/model-selector/src/connect-model-selector.js";
</script>
```

如果业务项目使用 Vercel 或静态部署，要确保这些路径能被访问。

如果业务项目也需要通过服务端代理刷新模型列表，需要保留：

```text
api/models.js
lib/server-models.js
```

本地开发服务器需要保留：

```text
server.js
```

## 接入验收清单

新项目接入后逐项确认：

- 页面右下角能打开模型选择器浮窗
- 登录后能读取统一 API 库
- 能切换供应商
- 能切换 Key alias
- 能展开模型列表
- 能选择模型
- 能打开参数设置
- 保存后业务项目数据库只出现 `selectionReference`
- 业务项目数据库没有 API Key
- 刷新页面后仍然恢复上次选择
- 换设备登录同一个 Supabase 用户后能读到 API 库
- 模型请求使用的是当前选择的 provider、keyAlias、model
- 当前模型不支持的参数不会进入最终请求体

## 常见错误

### 业务项目把 API Key 存进自己的数据库

这是接入错误。业务项目只能保存 `selectionReference`。

### 保存了 activeConfig

`activeConfig` 是运行时配置，包含 API Key。不要保存。只保存 `activeConfig.selectionReference`。

### 每个项目都去 Supabase 后台新建表

不需要。项目隔离靠 `projectCode` 和业务项目自己的 `selectionReference`，不是靠每个项目新建一套表。

### 模型参数在不同模型间乱传

业务项目不要手写固定参数。使用选择器产生的 `modelParams`，并让调用层在请求前通过选择器的安全裁剪逻辑生成最终参数。

### 项目迁移后路径失效

检查 CSS 和 JS import 路径是否仍然指向实际的 `model-selector/src`。

## 给下一个项目的最短交接话术

复制下面这段给新项目：

```text
本项目使用 Model Selector 作为模型选择浮窗。你需要在页面引入 /model-selector/src/model-selector.css 和 /model-selector/src/connect-model-selector.js。

业务项目必须提供 projectId、projectCode，并在自己的数据库里保存 selectionReference。不要保存 apiKey 或 activeConfig。

onChange(activeConfig) 里只保存 activeConfig.selectionReference。真正调用模型时，用 selector.getActiveConfig() 获取当前运行时配置，再组织本项目自己的 messages 和结果解析。

如果数据库支持 JSON，请建一个 model_selection_reference JSON 字段；不支持 JSON 就用 text 保存 JSON 字符串。
```
