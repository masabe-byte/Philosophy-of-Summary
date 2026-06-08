import { computeSafeModelParams, normalizeProviderModelId } from "./model-selector-core.js";

const OPENAI_COMPATIBLE_PROVIDERS = new Set([
  "openrouter",
  "groq",
  "openai",
  "deepseek",
  "gemini",
  "glm",
  "cerebras",
  "qwen",
  "requesty",
  "portkey",
  "local",
  "custom"
]);

const NON_CHAT_MODEL_PATTERNS = [
  /(^|[-_/])embedding(s)?($|[-_/])/,
  /text[-_]?embedding/,
  /text_embedding/,
  /(^|[-_/])whisper($|[-_/])/,
  /transcribe/,
  /(^|[-_/])tts($|[-_/])/,
  /moderation/,
  /rerank/,
  /image-generation/,
  /(^|[-_/])image($|[-_/])/
];

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function chatCompletionsUrl(config) {
  if (config.provider === "cloudflare") {
    const accountId = config.extra?.accountId;
    if (!accountId) throw new Error("Cloudflare Account ID is missing");
    return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
  }
  if (!OPENAI_COMPATIBLE_PROVIDERS.has(config.provider)) {
    throw new Error(`Unsupported provider for chat completions: ${config.provider}`);
  }
  if (!config.baseUrl) throw new Error("Base URL is missing");
  return `${trimSlash(config.baseUrl)}/chat/completions`;
}

function configuredKey(config) {
  return config.provider === "cloudflare"
    ? config.extra?.apiToken || config.apiKey || ""
    : config.apiKey || "";
}

function authHeader(config) {
  return `Bearer ${configuredKey(config)}`;
}

function requestParamOverrides(request = {}, provider = "custom", model = "") {
  const direct = {};
  for (const key of [
    "temperature",
    "top_p",
    "topP",
    "top_k",
    "topK",
    "response_format",
    "responseFormat",
    "reasoning_effort",
    "reasoningEffort",
    "reasoning",
    "thinking",
    "include_reasoning",
    "includeReasoning",
    "reasoning_budget",
    "reasoningBudget",
    "fact_check",
    "factCheck",
    "max_tokens",
    "maxTokens",
    "max_completion_tokens",
    "maxCompletionTokens",
    "seed",
    "tool_choice",
    "toolChoice",
    "do_sample",
    "doSample",
    "presence_penalty",
    "presencePenalty",
    "frequency_penalty",
    "frequencyPenalty"
  ]) {
    if (request[key] !== undefined) direct[key] = request[key];
  }
  const nested = Object.fromEntries(
    Object.entries(request.params || {}).filter(([, value]) => value !== undefined)
  );
  const merged = { ...direct, ...nested };
  if (merged.reasoning && typeof merged.reasoning === "object" && merged.reasoning.effort !== undefined) {
    merged.reasoning_effort = merged.reasoning.effort;
    delete merged.reasoning;
  }
  if (merged.thinking && typeof merged.thinking === "object") {
    const effort = merged.thinking.reasoning_effort || merged.thinking.effort;
    if (effort !== undefined) merged.reasoning_effort = effort;
    delete merged.thinking;
  }
  const maxTokenAliases = ["max_tokens", "maxTokens", "max_completion_tokens", "maxCompletionTokens"];
  const preferredMaxTokenAliases = maxTokensRequestKey(provider, model) === "max_completion_tokens"
    ? ["max_completion_tokens", "maxCompletionTokens", "max_tokens", "maxTokens"]
    : ["max_tokens", "maxTokens", "max_completion_tokens", "maxCompletionTokens"];
  const preferredMaxTokenAlias = preferredMaxTokenAliases
    .find((key) => merged[key] !== undefined && merged[key] !== null && merged[key] !== "");
  const maxTokenValue = preferredMaxTokenAlias ? merged[preferredMaxTokenAlias] : undefined;
  for (const key of maxTokenAliases) delete merged[key];
  if (maxTokenValue !== undefined) merged.max_tokens = maxTokenValue;
  return merged;
}

function internalParamKey(key) {
  const normalized = String(key || "").toLowerCase();
  return {
    temperature: "temperature",
    top_p: "topP",
    topp: "topP",
    top_k: "topK",
    topk: "topK",
    response_format: "responseFormat",
    responseformat: "responseFormat",
    reasoning: "reasoningEffort",
    thinking: "reasoningEffort",
    reasoning_effort: "reasoningEffort",
    reasoningeffort: "reasoningEffort",
    max_tokens: "maxTokens",
    maxtokens: "maxTokens",
    max_completion_tokens: "maxTokens",
    maxcompletiontokens: "maxTokens",
    seed: "seed",
    tool_choice: "toolChoice",
    toolchoice: "toolChoice",
    do_sample: "doSample",
    dosample: "doSample",
    presence_penalty: "presencePenalty",
    presencepenalty: "presencePenalty",
    frequency_penalty: "frequencyPenalty",
    frequencypenalty: "frequencyPenalty",
    include_reasoning: "includeReasoning",
    includereasoning: "includeReasoning",
    reasoning_budget: "reasoningBudget",
    reasoningbudget: "reasoningBudget",
    fact_check: "factCheck",
    factcheck: "factCheck"
  }[normalized] || "";
}

function requestEnabledOverrides(request = {}, provider = "custom", model = "") {
  const enabled = {};
  for (const key of Object.keys(requestParamOverrides(request, provider, model))) {
    const internal = internalParamKey(key);
    if (internal) enabled[internal] = true;
  }
  return enabled;
}

function isReasoningStyleModel(provider, model) {
  const id = String(model || "").toLowerCase();
  if (provider === "openai") return /(^|\/)(o\d|o\d-|gpt-5)/.test(id);
  if (provider === "groq") return id.startsWith("openai/gpt-oss-") || id.includes("deepseek-r1");
  if (provider === "openrouter") return id.includes("/gpt-oss-") || id.includes("deepseek-r1") || /(^|\/)(o\d|o\d-|gpt-5)/.test(id);
  return false;
}

function maxTokensRequestKey(provider, model) {
  if (provider === "openrouter") return "max_tokens";
  return isReasoningStyleModel(provider, model) ? "max_completion_tokens" : "max_tokens";
}

function conservativeOutputLimit(provider, model, modelMeta = {}) {
  return 0;
}

function normalizeReasoningParams(provider, next) {
  if (next.reasoning_effort === undefined) return;
  const effort = String(next.reasoning_effort || "medium").toLowerCase();
  if (provider === "openrouter") {
    next.reasoning = { effort };
    delete next.reasoning_effort;
    return;
  }
  if (provider === "deepseek") {
    next.thinking = {
      type: "enabled",
      reasoning_effort: ["low", "medium", "high"].includes(effort) ? effort : "medium"
    };
    delete next.reasoning_effort;
  }
}

function normalizeRequestParams(provider, model, params = {}, request = {}) {
  const next = { ...params };
  if (!request.allowExperimentalParams) {
    delete next.reasoning;
    delete next.reasoning_budget;
    delete next.fact_check;
  }
  normalizeReasoningParams(provider, next);
  if (provider === "openai" && isReasoningStyleModel(provider, model)) {
    delete next.temperature;
    delete next.top_p;
    delete next.presence_penalty;
    delete next.frequency_penalty;
  }
  if (next.max_tokens !== undefined) {
    const conservative = conservativeOutputLimit(provider, model, request.modelMeta || {});
    if (conservative) next.max_tokens = Math.min(Number(next.max_tokens) || conservative, conservative);
    const key = maxTokensRequestKey(provider, model);
    if (key !== "max_tokens") {
      next[key] = next.max_tokens;
      delete next.max_tokens;
    }
  }

  if (request.responseFormat && supportsRequestParameter(request.modelMeta, "response_format")) {
    next.response_format = request.responseFormat;
  }

  return next;
}

function canonicalRequestParamName(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function supportsRequestParameter(modelMeta = {}, requestKey = "") {
  const supported = (modelMeta.supportedParameters || []).map((item) => canonicalRequestParamName(item));
  if (!supported.length) return true;
  return supported.includes(canonicalRequestParamName(requestKey));
}

function isProbablyNonChatModel(provider, model = "", modelMeta = {}) {
  const id = String(model || "").toLowerCase();
  const type = String(modelMeta.type || modelMeta.modelType || "").toLowerCase();
  if (type && !["chat", "llm", "text-generation"].includes(type)) return true;
  if (NON_CHAT_MODEL_PATTERNS.some((pattern) => pattern.test(id))) return true;
  if (provider === "gemini" && (id.includes("image") || id.includes("banana"))) return true;
  return false;
}

function createBody(config, request) {
  const model = normalizeProviderModelId(config.provider, request.model || config.model);
  const modelMeta = request.modelMeta || config.modelMeta || {};
  if (!model) throw new Error("Model is missing");
  if (isProbablyNonChatModel(config.provider, model, modelMeta)) {
    throw new Error(`Model "${model}" is not a chat model and cannot be used with chat/completions.`);
  }

  const safe = computeSafeModelParams({
    provider: config.provider,
    modelMeta,
    params: { ...(config.params || {}), ...requestParamOverrides(request, config.provider, model) },
    enabled: { ...(config.paramEnabled || {}), ...requestEnabledOverrides(request, config.provider, model), ...(request.paramEnabled || {}) },
    messages: request.messages || [],
    affordableMaxTokens: request.affordableMaxTokens
  });
  const params = normalizeRequestParams(config.provider, model, safe.params, { ...request, modelMeta });

  if (config.provider === "cloudflare") {
    return {
      model,
      messages: request.messages,
      ...(request.stream ? { stream: true } : {}),
      ...params
    };
  }

  return {
    model,
    messages: request.messages,
    ...(request.stream ? { stream: true } : {}),
    ...params
  };
}

function maskKey(value = "") {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 12) return `${text.slice(0, 3)}***${text.slice(-2)}`;
  return `${text.slice(0, 8)}***${text.slice(-6)}`;
}

export function providerCredentialWarning(config = {}) {
  const key = configuredKey(config);
  const provider = config.provider || "";
  if (!key || provider === "local" || provider === "custom") return "";
  const checks = {
    openrouter: { prefix: "sk-or-", label: "OpenRouter" },
    groq: { prefix: "gsk_", label: "Groq" },
    glm: { pattern: /^[a-f0-9]{32}\./i, label: "智谱 AI" },
    openai: { prefix: "sk-", label: "OpenAI" },
    gemini: { prefix: "AIza", label: "Gemini" }
  };
  const rule = checks[provider];
  if (!rule) return "";
  const ok = rule.pattern ? rule.pattern.test(key) : key.startsWith(rule.prefix);
  return ok ? "" : `当前 ${rule.label} 的 Key 格式看起来不匹配，可能选错了供应商或 key alias。`;
}

export function createModelRequestPreview(activeConfig, request = {}) {
  if (!activeConfig) return null;
  const body = request.messages?.length ? createBody(activeConfig, request) : null;
  const key = configuredKey(activeConfig);
  const model = normalizeProviderModelId(activeConfig.provider, request.model || activeConfig.model);
  return {
    provider: activeConfig.provider,
    providerLabel: activeConfig.providerLabel,
    model,
    keyAlias: activeConfig.extra?.keyAlias || activeConfig.keyAlias || activeConfig.selectionReference?.keyAlias || "",
    key: maskKey(key),
    keyWarning: providerCredentialWarning(activeConfig),
    baseUrl: activeConfig.baseUrl || "",
    url: chatCompletionsUrl(activeConfig),
    headers: {
      "Content-Type": "application/json",
      Authorization: key ? `Bearer ${maskKey(key)}` : "",
      ...(activeConfig.headers || {}),
      ...(request.headers || {})
    },
    body
  };
}

export function extractAffordableTokenLimit(message = "") {
  const text = String(message || "");
  const match = text.match(/can only afford\s+([\d,]+)/i) ||
    text.match(/afford(?:\s+up\s+to)?\s+([\d,]+)\s+tokens?/i) ||
    text.match(/fewer max_tokens.*?([\d,]+)/i);
  return match ? Number(String(match[1]).replace(/,/g, "")) : null;
}

export function classifyModelRequestError(error) {
  const payload = error?.payload || {};
  const rawMessage = payload.error?.message || payload.errors?.[0]?.message || error?.message || "";
  const code = payload.error?.code || payload.errors?.[0]?.code || error?.status || "";
  const metadata = payload.error?.metadata || {};
  const raw = metadata.raw || rawMessage;
  const text = `${rawMessage} ${code} ${raw}`.toLowerCase();

  if (text.includes("unsupported parameter") || text.includes("unsupported_params") || text.includes("invalid parameter")) {
    return {
      code: "UNSUPPORTED_PARAMETER",
      message: "请求里包含当前模型或供应商不支持的参数，请刷新模型能力，或关闭相关参数后重试。"
    };
  }
  if (text.includes("no endpoints found") || text.includes("model not found") || text.includes("not a valid model") || text.includes("does not exist") || text.includes("not available in the latest model list") || text.includes("refresh or choose another model")) {
    return {
      code: "MODEL_NOT_AVAILABLE",
      message: "当前模型不在可用名单里，可能已下线、拼写不对，或者需要刷新模型列表后重新选择。"
    };
  }
  if (text.includes("invalid api key") || text.includes("invalid_api_key") || text.includes("unauthorized")) {
    return {
      code: "AUTH_INVALID",
      message: "API Key 无效。请在模型选择器里切换到可用 Key，或删除后重新添加并测试。"
    };
  }
  if (text.includes("can only afford") || text.includes("more credits") || text.includes("insufficient")) {
    return {
      code: "INSUFFICIENT_CREDITS",
      message: "当前 Key 余额或额度不足。请降低最大输出、换 Key，或更换模型。"
    };
  }
  if (error?.status === 429 || String(code) === "429" || text.includes("rate-limited") || text.includes("rate limit")) {
    const retryAfter = metadata.retry_after_seconds || metadata.retry_after_seconds_raw || metadata.headers?.["Retry-After"];
    return {
      code: "RATE_LIMIT",
      message: `模型或上游供应商临时限流。${retryAfter ? `建议 ${Math.ceil(Number(retryAfter))} 秒后重试，` : ""}也可以切换模型或使用自己的供应商 Key。`
    };
  }
  if (text.includes("timeout") || error?.name === "AbortError") {
    return {
      code: "TIMEOUT",
      message: "请求超时。请稍后重试，或切换到响应更快的模型。"
    };
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return {
      code: "NETWORK_ERROR",
      message: "网络连接失败。请检查网络、接口地址或服务商状态。"
    };
  }
  return {
    code: code ? String(code).toUpperCase() : "MODEL_REQUEST_FAILED",
    message: rawMessage || "模型请求失败。请检查模型、Key、额度和接口地址。"
  };
}

export async function chatWithActiveConfig(activeConfig, request = {}) {
  if (!activeConfig) throw new Error("Active model config is missing");
  if (!configuredKey(activeConfig)) throw new Error("API key is missing");
  if (activeConfig.modelAvailable === false) {
    throw new Error("Current model is not available in the latest model list. Refresh or choose another model.");
  }
  if (!request.messages?.length) throw new Error("messages is required");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 60000);

  try {
    const response = await fetch(chatCompletionsUrl(activeConfig), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(activeConfig),
        ...(activeConfig.headers || {}),
        ...(request.headers || {})
      },
      body: JSON.stringify(createBody(activeConfig, request)),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error?.message || payload.errors?.[0]?.message || response.statusText;
      const error = new Error(`Model request failed: ${message}`);
      error.status = response.status;
      error.payload = payload;
      error.affordableMaxTokens = extractAffordableTokenLimit(`${message} ${JSON.stringify(payload)}`);
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function getAssistantText(payload) {
  return payload?.choices?.[0]?.message?.content || payload?.result?.response || "";
}
