# Model Selector 快速接入

这份是给后续业务项目的最短说明。

## 结论

不是“每换一次模型就复制一次给其他项目”。
正确做法只有两层：

1. 复制 `model-selector/` 目录到业务项目
2. 业务项目只保存一份 `selectionReference`

模型、Key、策略都在选择器里改；业务项目只接收这份引用，不保存 API Key。

## 新项目要准备什么

每个业务项目只需要准备：

- `projectId`
- `projectCode`
- 一个能保存 JSON 的字段，用来存 `selectionReference`
- 一个真正调用模型的地方，用 `selector.getActiveConfig()` 取运行时配置

其他业务项目不需要、也不应该登录模型选择器的 Supabase。它们统一走服务端免登录接口。额外准备一个统一的模型选择器服务地址，例如：

```text
https://model-selector.example.com
```

业务项目通过这个地址访问：

```text
/api/selector-state
/api/models
```

建议的 `projectCode` 形式：

```text
model_selector_项目名-5位乱码
```

例如：

```text
model_selector_planning-Ab12C
```

## 最小接入方式

```html
<link rel="stylesheet" href="/model-selector/src/model-selector.css">

<script type="module">
  import { connectFloatingModelSelector } from "/model-selector/src/connect-model-selector.js";

  const savedReference = await loadSelectionReferenceFromProjectDb();

  const selector = await connectFloatingModelSelector({
    projectId: "planning",
    projectCode: "model_selector_planning-Ab12C",
    selectionReference: savedReference,
    // 其他业务项目统一走免登录个人模式。
    // 如果 /api/selector-state 和 /api/models 就在同域，可以省略这两项。
    stateEndpoint: "https://model-selector.example.com/api/selector-state",
    modelsEndpoint: "https://model-selector.example.com/api/models",
    modelSelectorAccessToken: "你的 MODEL_SELECTOR_ACCESS_TOKEN",
    onChange(activeConfig) {
      if (!activeConfig?.selectionReference) return;
      saveSelectionReferenceToProjectDb(activeConfig.selectionReference);
    }
  });

  const activeConfig = selector.getActiveConfig();
</script>
```

## 自动切换策略

选择器支持三种策略：

- `fixed`：固定使用当前模型
- `primary`：保存为主模型
- `fallback`：当前模型失败后，按备用模型顺序自动切换

如果想用自动切换，业务项目只要读取 `selectionReference.strategy` 和 `selectionReference.fallbacks`，自己按顺序试就行。

## 业务项目只存什么

只存：

```json
{
  "version": 1,
  "projectCode": "model_selector_planning-Ab12C",
  "libraryId": "common",
  "provider": "openrouter",
  "keyAlias": "1",
  "model": "openai/gpt-oss-120b:free",
  "strategy": "fallback",
  "fallbacks": [],
  "modelParams": {
    "temperature": 1,
    "max_tokens": 4096
  },
  "updatedAt": "2026-05-29T00:00:00.000Z"
}
```

不要存：

- `apiKey`
- `apiToken`
- `Authorization`
- 完整供应商配置

## 免登录个人模式

不要把 Supabase service role / secret key 放进前端。  
其他业务项目永远不登录模型选择器 Supabase。把 service key 放在模型选择器服务端环境变量里：

```text
SUPABASE_URL=https://vcixggayhuzrjpzutnkz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 service role / secret key
MODEL_SELECTOR_OWNER_ID=你的 Supabase Auth 用户 uuid
MODEL_SELECTOR_ACCESS_TOKEN=一串很长的随机访问密码
```

然后新项目传入 `stateEndpoint`、`modelsEndpoint` 和 `modelSelectorAccessToken`。这样其他项目不需要登录，只通过你的模型选择器服务读取统一 API 库。

服务端设置 `MODEL_SELECTOR_ACCESS_TOKEN` 后，没有 token 的请求会返回 404。
