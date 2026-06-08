import { DOC_PROVIDER_ALIASES, PROVIDER_DOC_DATA } from "./provider-doc-data.js";

export const COMMON_LIBRARY_ID = "common";
export const SELECTION_REFERENCE_VERSION = 1;
export const PARAM_INTENT_VERSION = 2;
export const PROJECT_CODE_PREFIX = "model_selector";
export const PROJECT_CODE_SUFFIX_LENGTH = 5;

export const STORAGE_KEYS = {
  libraries: "model-selector:libraries:v1",
  projects: "model-selector:projects:v1"
};

const PROJECT_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomProjectSuffix(length = PROJECT_CODE_SUFFIX_LENGTH) {
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => PROJECT_CODE_CHARS[byte % PROJECT_CODE_CHARS.length]).join("");
}

function stableProjectSuffix(text = "", length = PROJECT_CODE_SUFFIX_LENGTH) {
  let hash = 0;
  for (const char of String(text || "")) {
    hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  }
  const base = hash.toString(36).padStart(length, "0");
  return base.slice(-length).toUpperCase();
}

export function createProjectCode(projectName = "default") {
  const slug = normalizeId(projectName, "default").replace(/[^a-z0-9_-]+/gi, "_");
  return `${PROJECT_CODE_PREFIX}_${slug}-${randomProjectSuffix()}`;
}

function fallbackProjectCode(projectName = "default") {
  const slug = normalizeId(projectName, "default").replace(/[^a-z0-9_-]+/gi, "_");
  return `${PROJECT_CODE_PREFIX}_${slug}-${stableProjectSuffix(projectName)}`;
}

export function defaultModelParams() {
  return {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    topK: 40,
    responseFormat: "text",
    reasoningEffort: "medium",
    doSample: true,
    seed: null,
    toolChoice: "auto",
    presencePenalty: 0,
    frequencyPenalty: 0
  };
}

export function defaultParamEnabled() {
  return {
    temperature: false,
    topP: false,
    maxTokens: false,
    responseFormat: false,
    reasoningEffort: false,
    topK: false,
    doSample: false,
    seed: false,
    toolChoice: false,
    presencePenalty: false,
    frequencyPenalty: false,
    includeReasoning: false,
    reasoning: false,
    reasoningBudget: false,
    factCheck: false
  };
}

export const GLOBAL_MAX_TOKENS = 32768;

function providerDocKey(provider = "custom") {
  return DOC_PROVIDER_ALIASES[provider] || provider;
}

export function providerDoc(provider = "custom") {
  return PROVIDER_DOC_DATA[providerDocKey(provider)] || null;
}

const DOC_IGNORED_PARAM_KEYS = new Set([
  "input",
  "content",
  "file",
  "title",
  "text",
  "audio",
  "prompt",
  "language",
  "user_id",
  "request_id",
  "tasktype",
  "outputdimensionality",
  "safetysettings"
]);

function normalizeDocParamKey(rawKey = "") {
  const normalized = String(rawKey || "").trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  if (!normalized || DOC_IGNORED_PARAM_KEYS.has(normalized) || DOC_IGNORED_PARAM_KEYS.has(compact)) return "";
  if (normalized.startsWith("generationconfig.")) {
    return normalizeDocParamKey(normalized.slice("generationconfig.".length));
  }
  if (normalized.startsWith("toolconfig.functioncallingconfig.")) {
    const rest = normalized.slice("toolconfig.functioncallingconfig.".length);
    if (rest === "mode") return "toolChoice";
  }
  return {
    temperature: "temperature",
    topp: "topP",
    top_p: "topP",
    topk: "topK",
    top_k: "topK",
    maxtokens: "maxTokens",
    max_tokens: "maxTokens",
    max_completion_tokens: "maxTokens",
    maxoutputtokens: "maxTokens",
    responseformat: "responseFormat",
    response_format: "responseFormat",
    responsemime_type: "responseFormat",
    responsemimetype: "responseFormat",
    responseschema: "responseSchema",
    reasoning: "reasoning",
    reasoningeffort: "reasoningEffort",
    reasoning_effort: "reasoningEffort",
    includesreasoning: "includeReasoning",
    include_reasoning: "includeReasoning",
    do_sample: "doSample",
    dosample: "doSample",
    tool_choice: "toolChoice",
    toolchoice: "toolChoice",
    tools: "tools",
    top_a: "topA",
    min_p: "minP",
    repetition_penalty: "repetitionPenalty",
    frequency_penalty: "frequencyPenalty",
    presence_penalty: "presencePenalty",
    seed: "seed",
    stop: "stop",
    stream: "stream",
    top_logprobs: "topLogprobs",
    logprobs: "logprobs"
  }[compact] || normalized;
}

function normalizeDocName(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[_-]+/g, " ");
}

const MODEL_VENDOR_PREFIXES = [
  "openai",
  "google",
  "anthropic",
  "deepseek",
  "meta",
  "mistral",
  "qwen",
  "alibaba",
  "baidu",
  "xai",
  "groq",
  "zhipu",
  "moonshotai",
  "nous",
  "liquidai",
  "poolside",
  "minimax",
  "nvidia",
  "cerebras",
  "cloudflare",
  "requesty",
  "portkey"
];

export function modelIdentityKey(provider = "custom", value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const display = normalizeDocName(displayNameForProviderModel(provider, raw));
  const freeFlag = /(^|[\s:/-])free(\)|$|\b)/i.test(raw) || /\(free\)/i.test(raw) || /\:free\b/i.test(raw);
  const normalized = String(display || raw)
    .replace(/\(free\)/g, "")
    .replace(/\[free\]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const stripped = normalized.startsWith("free ") ? normalized.slice(5) : normalized.replace(/\sfree$/, "");
  for (const prefix of MODEL_VENDOR_PREFIXES) {
    if (stripped === prefix || stripped.startsWith(`${prefix} `) || stripped.startsWith(`${prefix}:`) || stripped.startsWith(`${prefix}/`) || stripped.startsWith(`${prefix}-`)) {
      const body = stripped.slice(prefix.length).trim().replace(/^[:/\-\s]+/, "").replace(/\s+/g, "").replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
      return freeFlag ? `${body}:free` : body;
    }
  }
  const body = stripped.replace(/\s+/g, "").replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
  return freeFlag ? `${body}:free` : body;
}

function modelDocEntries(provider = "custom") {
  const doc = providerDoc(provider);
  if (!doc?.categories) return [];
  const entries = [];
  for (const [categoryId, category] of Object.entries(doc.categories || {})) {
    for (const name of category.models || []) {
      entries.push({
        provider,
        categoryId,
        category,
        name,
        free: Boolean((category.free_models || []).includes(name))
      });
    }
  }
  return entries;
}

function isSelectableDocCategory(categoryId = "", category = {}) {
  const id = String(categoryId || "").toLowerCase();
  const text = `${id} ${category.description || ""}`.toLowerCase();
  if (/router|gateway|control|embedding|tts|speech_to_text|transcription|moderation/.test(text)) return false;
  return /chat|reason|vision|multimodal|completion|text generation|standard|open_source/.test(text);
}

function docModelsForProvider(provider = "custom") {
  const entries = modelDocEntries(provider);
  if (!entries.length) return [];
  const unique = new Map();
  for (const entry of entries) {
    if (!isSelectableDocCategory(entry.categoryId, entry.category)) continue;
    const key = modelIdentityKey(provider, entry.name);
    if (!key || unique.has(key)) continue;
    unique.set(key, entry);
  }
  return Array.from(unique.values())
    .sort((a, b) => {
      if (a.free !== b.free) return a.free ? -1 : 1;
      const left = normalizeDocName(a.name);
      const right = normalizeDocName(b.name);
      return left.localeCompare(right, "zh-CN", { numeric: true, sensitivity: "base" });
    })
    .map((entry) => entry.name);
}

function findDocEntryForModel(provider = "custom", model = "") {
  const raw = String(model || "").trim();
  if (!raw) return null;
  const normalizedRaw = modelIdentityKey(provider, raw);
  const normalizedDisplay = modelIdentityKey(provider, displayNameForProviderModel(provider, raw));
  const rawWithoutFree = normalizedRaw.replace(/:free$/, "");
  const displayWithoutFree = normalizedDisplay.replace(/:free$/, "");
  return modelDocEntries(provider).find((entry) => {
    const normalizedEntry = modelIdentityKey(provider, entry.name);
    const entryWithoutFree = normalizedEntry.replace(/:free$/, "");
    return normalizedEntry === normalizedRaw ||
      normalizedEntry === normalizedDisplay ||
      entryWithoutFree === rawWithoutFree ||
      entryWithoutFree === displayWithoutFree;
  }) || null;
}

export function isModelFreeForProvider(provider = "custom", model = "") {
  const normalized = String(model || "").toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(":free")) return true;
  const entry = findDocEntryForModel(provider, model);
  if (entry?.free) return true;
  return Boolean(normalizeModelMeta({ id: model, name: model }, provider).capabilities?.includes("FREE"));
}

export function modelSortKeyForProvider(provider = "custom", model = {}) {
  const raw = String(model?.name || model?.id || model || "");
  return modelIdentityKey(provider, raw).replace(/:free$/, "") ||
    raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function compareModelsForProvider(provider = "custom", a = {}, b = {}) {
  const freeA = isModelFreeForProvider(provider, a.id || a.name || a) ? 0 : 1;
  const freeB = isModelFreeForProvider(provider, b.id || b.name || b) ? 0 : 1;
  if (freeA !== freeB) return freeA - freeB;
  const keyOrder = modelSortKeyForProvider(provider, a)
    .localeCompare(modelSortKeyForProvider(provider, b), "zh-CN", { sensitivity: "base", numeric: true });
  if (keyOrder !== 0) return keyOrder;
  return String(a.id || a.name || a).localeCompare(String(b.id || b.name || b), "en", { sensitivity: "base", numeric: true });
}

export const PARAM_SCHEMAS = {
  temperature: {
    label: "温度",
    requestKey: "temperature",
    type: "number",
    defaultValue: 0.7,
    min: 0,
    max: 2,
    step: 0.1,
    tooltip: "控制回答的发散程度。越低越稳定，越高越有变化。"
  },
  topP: {
    label: "Top P",
    requestKey: "top_p",
    aliases: ["top_p"],
    type: "number",
    defaultValue: 0.95,
    min: 0,
    max: 1,
    step: 0.01,
    tooltip: "控制候选词范围。通常不需要和温度一起大幅调整。"
  },
  topK: {
    label: "Top K",
    requestKey: "top_k",
    aliases: ["top_k", "topK", "generationConfig.topK"],
    type: "integer",
    defaultValue: 40,
    min: 1,
    max: 100,
    step: 1,
    tooltip: "每一步只从概率最高的前 K 个候选里采样。"
  },
  maxTokens: {
    label: "最大标记",
    requestKey: "max_tokens",
    aliases: ["max_tokens", "max_completion_tokens"],
    type: "integer",
    defaultValue: 2048,
    min: 1,
    max: GLOBAL_MAX_TOKENS,
    step: 1,
    tooltip: "本次最多允许模型输出多少 token。它不是上下文长度。"
  },
  seed: {
    label: "Seed",
    requestKey: "seed",
    aliases: ["seed"],
    type: "integer",
    defaultValue: null,
    min: 0,
    max: 2147483647,
    step: 1,
    tooltip: "随机种子。相同种子可提高复现一致性。"
  },
  responseFormat: {
    label: "回复格式",
    requestKey: "response_format",
    aliases: ["response_format", "structured_outputs", "responseSchema", "response_schema", "generationConfig.responseMimeType"],
    type: "enum",
    defaultValue: "text",
    options: [
      { value: "text", label: "普通文本" },
      { value: "json_object", label: "JSON Object" },
      { value: "json_schema", label: "JSON Schema" }
    ],
    tooltip: "控制模型输出格式。JSON Schema 会发送一个通用严格 schema，业务项目可在请求前替换为自己的 schema。"
  },
  doSample: {
    label: "采样",
    requestKey: "do_sample",
    aliases: ["do_sample"],
    type: "boolean",
    defaultValue: true,
    tooltip: "是否启用随机采样。关闭后模型更接近确定性输出。"
  },
  reasoningEffort: {
    label: "推理工作",
    requestKey: "reasoning_effort",
    aliases: ["reasoning_effort", "reasoning"],
    type: "enum",
    defaultValue: "medium",
    options: [
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" }
    ],
    tooltip: "控制推理模型投入多少思考。支持 low / medium / high 的模型会按当前选择发送。"
  },
  toolChoice: {
    label: "工具选择",
    requestKey: "tool_choice",
    aliases: ["tool_choice", "toolConfig.functionCallingConfig.mode"],
    type: "enum",
    defaultValue: "auto",
    options: [
      { value: "none", label: "none" },
      { value: "auto", label: "auto" },
      { value: "required", label: "required" }
    ],
    tooltip: "控制模型是否以及如何调用工具。"
  },
  frequencyPenalty: {
    label: "频率惩罚",
    requestKey: "frequency_penalty",
    aliases: ["frequency_penalty"],
    type: "number",
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.1,
    tooltip: "降低重复用词的概率。"
  },
  presencePenalty: {
    label: "存在惩罚",
    requestKey: "presence_penalty",
    aliases: ["presence_penalty"],
    type: "number",
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.1,
    tooltip: "鼓励模型引入新话题。"
  },
  includeReasoning: {
    label: "返回思考过程",
    requestKey: "include_reasoning",
    aliases: ["include_reasoning"],
    type: "boolean",
    defaultValue: false,
    tooltip: "仅对支持 reasoning 输出的模型展示。"
  },
  reasoning: {
    label: "思考模式",
    requestKey: "reasoning",
    type: "boolean",
    defaultValue: false,
    tooltip: "开启后请求模型使用推理能力。仅支持相关模型。"
  },
  reasoningBudget: {
    label: "思考预算",
    requestKey: "reasoning_budget",
    aliases: ["reasoning_budget"],
    type: "integer",
    defaultValue: 1024,
    min: 0,
    max: 8192,
    step: 128,
    tooltip: "限制推理模型内部思考预算。"
  },
  factCheck: {
    label: "事实核查",
    requestKey: "fact_check",
    aliases: ["fact_check"],
    type: "boolean",
    defaultValue: false,
    tooltip: "给支持该扩展的模型或业务层使用。"
  }
};

function internalParamKey(key) {
  const normalized = String(key || "").toLowerCase();
  for (const internalKey of Object.keys(PARAM_SCHEMAS)) {
    if (internalKey.toLowerCase() === normalized) return internalKey;
  }
  for (const [internalKey, schema] of Object.entries(PARAM_SCHEMAS)) {
    const candidates = [internalKey, schema.requestKey, ...(schema.aliases || [])]
      .map((item) => String(item).toLowerCase());
    if (candidates.includes(normalized)) return internalKey;
  }
  return key;
}

function externalParamKey(key) {
  return PARAM_SCHEMAS[key]?.requestKey || key;
}

function normalizeResponseFormatValue(value) {
  if (!value || typeof value !== "object") return value;
  const type = String(value.type || value.response_format || "").toLowerCase();
  if (type === "json_schema") return "json_schema";
  if (type === "json_object") return "json_object";
  if (type === "text" || type === "text/plain") return "text";
  return value;
}

export const LOCAL_MODEL_SCHEMAS = {
  openrouter: {
    supportedParameters: ["temperature", "topP", "topK", "maxTokens", "frequencyPenalty", "presencePenalty", "responseFormat", "reasoningEffort", "includeReasoning", "toolChoice", "response_format", "structured_outputs", "reasoning", "tools"],
    capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
    defaultMaxTokens: 4096
  },
  groq: {
    supportedParameters: ["temperature", "topP", "maxTokens", "seed", "responseFormat", "reasoningEffort", "includeReasoning", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS", "JSON", "REASONING"],
    defaultMaxTokens: 4096
  },
  openai: {
    supportedParameters: ["temperature", "topP", "maxTokens", "seed", "frequencyPenalty", "presencePenalty", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS", "JSON"],
    defaultMaxTokens: 2048
  },
  deepseek: {
    supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
    defaultMaxTokens: 4096
  },
  gemini: {
    supportedParameters: ["temperature", "topP", "topK", "maxTokens", "seed", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "VISION", "TOOLS"],
    defaultMaxTokens: 2048
  },
  glm: {
    supportedParameters: ["temperature", "topP", "maxTokens", "seed", "doSample", "toolChoice", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS"],
    defaultMaxTokens: 2048
  },
  cerebras: {
    supportedParameters: ["temperature", "topP", "maxTokens"],
    capabilities: ["LLM", "CHAT"],
    defaultMaxTokens: 2048
  },
  cloudflare: {
    supportedParameters: ["temperature", "maxTokens"],
    capabilities: ["LLM", "CHAT"],
    defaultMaxTokens: 1024
  },
  qwen: {
    supportedParameters: ["temperature", "topP", "topK", "maxTokens", "seed", "toolChoice", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS"],
    defaultMaxTokens: 2048
  },
  requesty: {
    supportedParameters: ["temperature", "topP", "topK", "maxTokens", "seed", "frequencyPenalty", "presencePenalty", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS", "JSON"],
    defaultMaxTokens: 2048
  },
  portkey: {
    supportedParameters: ["temperature", "topP", "topK", "maxTokens", "seed", "frequencyPenalty", "presencePenalty", "toolChoice", "response_format", "tools"],
    capabilities: ["LLM", "CHAT", "TOOLS", "JSON"],
    defaultMaxTokens: 2048
  },
  local: {
    supportedParameters: ["temperature", "topP", "maxTokens", "seed"],
    capabilities: ["LLM", "CHAT"],
    defaultMaxTokens: 2048
  },
  custom: {
    supportedParameters: ["temperature", "topP", "maxTokens", "seed"],
    capabilities: ["LLM", "CHAT"],
    defaultMaxTokens: 1024
  }
};

export function mergeModelParams(saved) {
  const defaults = defaultModelParams();
  if (!saved || typeof saved !== "object") return defaults;
  const next = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    const internalKey = internalParamKey(key);
    if (!internalKey) continue;
    const schema = PARAM_SCHEMAS[internalKey];
    if (!schema) {
      continue;
    }
    if (value === null || value === undefined || value === "") {
      next[internalKey] = value;
      continue;
    }
    if (schema.type === "number" || schema.type === "integer") {
      const numeric = Number(value);
      next[internalKey] = Number.isFinite(numeric)
        ? (schema.type === "integer" ? Math.floor(numeric) : numeric)
        : value;
      continue;
    }
    if (schema.type === "boolean") {
      next[internalKey] = value === true || value === "true";
      continue;
    }
    if (schema.type === "enum") {
      const enumValue = internalKey === "responseFormat" ? normalizeResponseFormatValue(value) : value;
      next[internalKey] = String(enumValue);
      continue;
    }
    next[internalKey] = value;
  }
  return next;
}

export function mergeParamEnabled(saved) {
  const defaults = defaultParamEnabled();
  if (!saved || typeof saved !== "object") return defaults;
  const next = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    const internalKey = internalParamKey(key);
    if (!internalKey) continue;
    next[internalKey] = Boolean(value);
  }
  return next;
}

export const PROVIDERS = {
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    fields: ["keyAliases", "baseUrl", "siteUrl", "appName"],
    defaultModel: "openai/gpt-5.4"
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "gpt-oss-120b"
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "gpt-5.5"
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "deepseek-chat"
  },
  gemini: {
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "gemini-2.5-flash"
  },
  glm: {
    label: "GLM / Zhipu",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "glm-4.5"
  },
  cerebras: {
    label: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "llama-4-scout-17b-16e-instruct"
  },
  cloudflare: {
    label: "Cloudflare Workers AI",
    baseUrl: "",
    fields: ["apiToken", "accountId"],
    defaultModel: "@cf/meta/llama-3.1-8b-instruct"
  },
  qwen: {
    label: "Qwen / DashScope",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "qwen-plus"
  },
  requesty: {
    label: "Requesty",
    baseUrl: "https://router.requesty.ai/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "openai/gpt-4o-mini"
  },
  portkey: {
    label: "Portkey",
    baseUrl: "https://api.portkey.ai/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "gpt-4o-mini"
  },
  custom: {
    label: "Custom",
    baseUrl: "",
    fields: ["apiKey", "baseUrl"],
    defaultModel: ""
  },
  local: {
    label: "Local",
    baseUrl: "http://localhost:1287/v1",
    fields: ["apiKey", "baseUrl"],
    defaultModel: "gpt-5.5"
  }
};

export const MODEL_PRESETS = [
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-5.4",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash",
  "google/gemini-2.5-flash",
  "deepseek/deepseek-v3.2",
  "xai/grok-4.3",
  "alibaba/qwen3.7-max",
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v4-pro"
];

export const MODEL_PICK_PRIORITIES = {
  groq: [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct"
  ],
  openrouter: [
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b:free",
    "openai/gpt-oss-20b",
    "deepseek/deepseek-v4-flash",
    "deepseek/deepseek-v4-pro",
    "openai/gpt-4o-mini",
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet-4.6"
  ],
  openai: ["gpt-4o-mini", "gpt-5-mini", "gpt-5"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  glm: ["glm-4.5-flash", "glm-4.5", "glm-z1-flash", "glm-4-flash"],
  qwen: ["qwen-plus", "qwen-turbo", "qwen-max"],
  deepseek: ["deepseek-v4-flash", "deepseek-v4-pro", "deepseek-chat", "deepseek-reasoner"]
};

export function isPoorDefaultChatModel(provider = "custom", value = "") {
  const id = normalizeProviderModelId(provider, value).toLowerCase();
  if (!id) return true;
  if (id.includes("allam")) return true;
  if (id.includes("prompt-guard") || id.includes("safeguard")) return true;
  if (id.includes("whisper") || id.includes("embedding") || id.includes("tts") || id.includes("moderation")) return true;
  if (id.includes("orpheus")) return true;
  return false;
}

export function preferredModelForProvider(provider = "custom", models = [], preferred = "") {
  const ids = models.map((model) => normalizeProviderModelId(provider, model?.id || model?.name || model)).filter(Boolean);
  const idSet = new Set(ids);
  const requestPreferred = normalizeProviderModelId(provider, preferred);
  if (requestPreferred && idSet.has(requestPreferred) && !isPoorDefaultChatModel(provider, requestPreferred)) return requestPreferred;

  for (const id of MODEL_PICK_PRIORITIES[provider] || []) {
    const requestId = normalizeProviderModelId(provider, id);
    if (idSet.has(requestId)) return requestId;
  }

  return ids.find((id) => !isPoorDefaultChatModel(provider, id)) || ids[0] || normalizeProviderModelId(provider, PROVIDERS[provider]?.defaultModel || "");
}

export const BASE_PROVIDER_MODELS = {
  groq: [
    "DeepSeek R1 Distill Llama 70B",
    "distil-whisper-large-v3-en",
    "Gemma 2 9B Instruction Tuned",
    "gpt-oss-120b",
    "gpt-oss-20b",
    "Kimi K2 Instruct",
    "Llama 4 Maverick 17B 128E Instruct Preview",
    "Llama 4 Scout 17B 16E Instruct Preview",
    "Llama-3.1-8b-instant",
    "Qwen3-32B",
    "whisper-large-v3",
    "whisper-large-v3-turbo"
  ],
  glm: [
    "embedding-2",
    "embedding-3",
    "glm-3-turbo",
    "glm-4",
    "glm-4-0520",
    "glm-4-air",
    "glm-4-air-0111",
    "glm-4-air-250414",
    "glm-4-airx",
    "glm-4-flash",
    "glm-4-flash-250414",
    "glm-4-flashx",
    "glm-4-flashx-250414",
    "glm-4-long",
    "glm-4-plus",
    "glm-4.1v-thinking-flash",
    "glm-4.1v-thinking-flashx",
    "glm-4.5",
    "glm-4.5-air",
    "glm-4.5-airx",
    "glm-4.5-flash",
    "glm-4.5-x",
    "glm-4.5v",
    "glm-4.6",
    "glm-4.6v",
    "glm-4.6v-flash",
    "glm-4.6v-flashx",
    "glm-4.7",
    "glm-4.7-flash",
    "glm-4.7-flashx",
    "glm-4v",
    "glm-4v-flash",
    "glm-4v-plus",
    "glm-4v-plus-0111",
    "glm-5",
    "glm-5.1",
    "glm-5-turbo",
    "glm-5v-turbo",
    "glm-z1-air",
    "glm-z1-airx",
    "glm-z1-flash",
    "glm-z1-flashx",
    "text_embedding"
  ],
  gemini: [
    "gemini-embedding-001",
    "gemini-embedding-2-preview",
    "Gemini 2.5 Flash",
    "Gemini 2.5 Flash-Lite",
    "Gemini 2.5 Pro",
    "Gemini 3 Flash Preview",
    "Gemini 3.1 Flash-Lite",
    "Gemini 3.1 Pro Preview",
    "Gemini 3.1 Pro Preview (Custom Tools)",
    "Gemini 3.5 Flash",
    "Gemini Flash Latest",
    "Gemini Flash-Lite Latest",
    "Nano Banana",
    "Nano Banana Pro"
  ],
  openai: [
    "chatgpt-4o-latest",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125",
    "gpt-3.5-turbo-1106",
    "gpt-3.5-turbo-16k",
    "gpt-3.5-turbo-instruct",
    "gpt-4-0125-preview",
    "gpt-4-1106-preview",
    "gpt-4-turbo",
    "gpt-4-turbo-2024-04-09",
    "gpt-4-turbo-preview",
    "gpt-4.1",
    "gpt-4.1-mini-2025-04-14",
    "gpt-4.1-nano",
    "gpt-4.1-nano-2025-04-14",
    "gpt-4o-audio-preview",
    "gpt-4o-audio-preview-2025-06-03",
    "gpt-4o-mini",
    "gpt-4o-mini-2024-07-18",
    "gpt-4o-mini-transcribe",
    "gpt-4o-mini-tts",
    "gpt-4o-transcribe",
    "gpt-5",
    "gpt-5-2025-08-07",
    "gpt-5-chat-latest",
    "gpt-5-mini",
    "gpt-5-mini-2025-08-07",
    "gpt-5-nano",
    "gpt-5-nano-2025-08-07",
    "gpt-5.1",
    "gpt-5.2",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.5",
    "o3-mini",
    "o3-mini-2025-01-31",
    "text-embedding-3-large",
    "text-embedding-3-small",
    "text-embedding-ada-002",
    "text-moderation-stable",
    "tts-1",
    "tts-1-hd",
    "whisper-1"
  ],
  deepseek: [
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "deepseek-chat",
    "deepseek-reasoner"
  ]
};

export const FOCUS_MODEL_SCHEMAS = {
  groq: {
    "openai/gpt-oss-120b": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "includeReasoning", "response_format", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 131072,
      maxCompletionTokens: 65536,
      defaultParameters: { temperature: 0.6, top_p: 0.95, max_tokens: 4096, reasoning_effort: "medium" }
    },
    "openai/gpt-oss-20b": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "includeReasoning", "response_format", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 131072,
      maxCompletionTokens: 65536,
      defaultParameters: { temperature: 0.6, top_p: 0.95, max_tokens: 4096, reasoning_effort: "medium" }
    }
  },
  openrouter: {
    "openai/gpt-oss-120b": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "includeReasoning", "response_format", "structured_outputs", "reasoning", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 131072,
      maxCompletionTokens: 131072,
      defaultParameters: { temperature: 1, top_p: 1, max_tokens: 4096, reasoning_effort: "medium" }
    },
    "openai/gpt-oss-120b:free": {
      supportedParameters: ["temperature", "maxTokens", "reasoningEffort", "includeReasoning", "reasoning", "tools"],
      capabilities: ["LLM", "CHAT", "TOOLS", "REASONING", "FREE"],
      contextLength: 131072,
      maxCompletionTokens: 131072,
      defaultParameters: { temperature: 1, max_tokens: 4096, reasoning_effort: "medium" }
    },
    "openai/gpt-oss-20b": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "includeReasoning", "response_format", "structured_outputs", "reasoning", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 131072,
      maxCompletionTokens: 131072,
      defaultParameters: { temperature: 1, top_p: 1, max_tokens: 4096, reasoning_effort: "medium" }
    },
    "openai/gpt-oss-20b:free": {
      supportedParameters: ["temperature", "maxTokens", "reasoningEffort", "includeReasoning", "reasoning", "tools"],
      capabilities: ["LLM", "CHAT", "TOOLS", "REASONING", "FREE"],
      contextLength: 131072,
      maxCompletionTokens: 8192,
      defaultParameters: { temperature: 1, max_tokens: 4096, reasoning_effort: "medium" }
    }
  },
  deepseek: {
    "deepseek-v4-flash": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "response_format", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 1048576,
      maxCompletionTokens: 16384,
      defaultParameters: { temperature: 1, top_p: 1, max_tokens: 4096, reasoning_effort: "high" }
    },
    "deepseek-v4-pro": {
      supportedParameters: ["temperature", "topP", "maxTokens", "responseFormat", "reasoningEffort", "response_format", "tools"],
      capabilities: ["LLM", "CHAT", "JSON", "TOOLS", "REASONING"],
      contextLength: 1048576,
      maxCompletionTokens: 384000,
      defaultParameters: { temperature: 1, top_p: 1, max_tokens: 4096, reasoning_effort: "high" }
    }
  }
};

export function baseModelsForProvider(provider) {
  if (provider === "openrouter" || provider === "requesty") return MODEL_PRESETS;
  const base = BASE_PROVIDER_MODELS[provider] || [];
  if (base.length) return base;
  const priorities = MODEL_PICK_PRIORITIES[provider] || [];
  if (priorities.length) return priorities;
  const defaultModel = PROVIDERS[provider]?.defaultModel || "";
  return defaultModel ? [defaultModel] : [];
}

export const MODEL_ID_ALIASES = {
  groq: {
    "DeepSeek R1 Distill Llama 70B": "deepseek-r1-distill-llama-70b",
    "Gemma 2 9B Instruction Tuned": "gemma2-9b-it",
    "gpt-oss-120b": "openai/gpt-oss-120b",
    "gpt-oss-20b": "openai/gpt-oss-20b",
    "Kimi K2 Instruct": "moonshotai/kimi-k2-instruct",
    "Llama 4 Maverick 17B 128E Instruct Preview": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "Llama 4 Scout 17B 16E Instruct Preview": "meta-llama/llama-4-scout-17b-16e-instruct",
    "Llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "Qwen3-32B": "qwen/qwen3-32b"
  },
  gemini: {
    "Gemini 2.5 Flash": "gemini-2.5-flash",
    "Gemini 2.5 Flash-Lite": "gemini-2.5-flash-lite",
    "Gemini 2.5 Pro": "gemini-2.5-pro",
    "Gemini 3 Flash Preview": "gemini-3-flash-preview",
    "Gemini 3.1 Flash-Lite": "gemini-3.1-flash-lite",
    "Gemini 3.1 Pro Preview": "gemini-3.1-pro-preview",
    "Gemini 3.1 Pro Preview (Custom Tools)": "gemini-3.1-pro-preview",
    "Gemini 3.5 Flash": "gemini-3.5-flash",
    "Gemini Flash Latest": "gemini-flash-latest",
    "Gemini Flash-Lite Latest": "gemini-flash-lite-latest",
    "Nano Banana": "gemini-2.5-flash-image",
    "Nano Banana Pro": "gemini-3-pro-image-preview"
  },
  deepseek: {
    "deepseek-v4-flash": "deepseek-v4-flash",
    "deepseek-v4-pro": "deepseek-v4-pro"
  }
};

export function normalizeProviderModelId(provider = "custom", value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (provider === "gemini" && raw.startsWith("models/")) return raw.slice("models/".length);
  return MODEL_ID_ALIASES[provider]?.[raw] || raw;
}

function focusModelSchema(provider = "custom", modelId = "") {
  const id = normalizeProviderModelId(provider, modelId);
  return FOCUS_MODEL_SCHEMAS[provider]?.[id] || null;
}

export function displayNameForProviderModel(provider = "custom", value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const aliases = MODEL_ID_ALIASES[provider] || {};
  if (aliases[raw]) return raw;
  const found = Object.entries(aliases).find(([, id]) => id === raw || (provider === "gemini" && `models/${id}` === raw));
  return found?.[0] || raw;
}

export function normalizeId(value, fallback = "default") {
  const id = String(value || "").trim().toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || fallback;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function maskSecret(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 8) return `${text.slice(0, 1)}****${text.slice(-1)}`;
  const head = Math.min(6, Math.max(3, Math.floor(text.length * 0.22)));
  const tail = Math.min(6, Math.max(3, Math.floor(text.length * 0.18)));
  return `${text.slice(0, head)}${"*".repeat(Math.max(6, text.length - head - tail))}${text.slice(-tail)}`;
}

export function normalizeModelMeta(model = {}, provider = "custom") {
  const rawId = String(model.id || model.name || model.model || "").trim();
  const id = normalizeProviderModelId(provider, rawId);
  const focusSchema = focusModelSchema(provider, id);
  const topProvider = model.top_provider || model.topProvider || {};
  const architecture = model.architecture || {};
  const supported = (model.supported_parameters || model.supportedParameters || focusSchema?.supportedParameters || [])
    .map((item) => normalizeDocParamKey(String(item).toLowerCase()))
    .filter(Boolean);
  const defaultParameters = Object.fromEntries(
    Object.entries({
      ...(focusSchema?.defaultParameters || {}),
      ...(model.default_parameters || model.defaultParameters || {})
    }).map(([key, value]) => [normalizeDocParamKey(key), value])
  );
  const contextLength = Number(
    model.context_length ||
    model.contextLength ||
    model.context_window ||
    model.contextWindow ||
    topProvider.context_length ||
    topProvider.contextLength ||
    topProvider.context_window ||
    topProvider.contextWindow ||
    model.input_token_limit ||
    focusSchema?.contextLength ||
    0
  );
  const maxCompletionTokens = Number(
    topProvider.max_completion_tokens ||
    topProvider.maxCompletionTokens ||
    model.max_completion_tokens ||
    model.output_token_limit ||
    focusSchema?.maxCompletionTokens ||
    0
  );
  const rawCapabilities = [
    ...(Array.isArray(model.capabilities) ? model.capabilities : []),
    ...(Array.isArray(model.tags) ? model.tags : []),
    architecture.modality,
    architecture.instruct_type,
    model.type
  ].filter(Boolean);
  const docEntry = findDocEntryForModel(provider, id) || findDocEntryForModel(provider, model.display_name || model.displayName || model.name || rawId);

  const idLower = id.toLowerCase();
  const capabilities = new Set(["LLM", "CHAT"]);
  for (const item of focusSchema?.capabilities || []) capabilities.add(String(item).toUpperCase());
  for (const item of rawCapabilities) capabilities.add(String(item).toUpperCase());
  if (idLower.includes("vision") || idLower.includes("vl") || String(architecture.input_modalities || "").includes("image")) capabilities.add("VISION");
  if (supported.includes("tools") || supported.includes("toolChoice")) capabilities.add("TOOLS");
  if (supported.includes("responseFormat") || supported.includes("responseSchema") || supported.includes("structured_outputs")) capabilities.add("JSON");
  if (idLower.includes(":free") || model.pricing?.prompt === "0" || model.pricing?.completion === "0" || docEntry?.free) capabilities.add("FREE");
  if (supported.includes("reasoning") || supported.includes("includeReasoning") || supported.includes("reasoningEffort") || idLower.includes("reason")) capabilities.add("REASONING");

  return {
    ...model,
    id,
    name: model.display_name || model.displayName || model.name || displayNameForProviderModel(provider, rawId || id),
    provider,
    contextLength: Number.isFinite(contextLength) ? contextLength : 0,
    maxCompletionTokens: Number.isFinite(maxCompletionTokens) ? maxCompletionTokens : 0,
    supportedParameters: Array.isArray(supported) ? supported : [],
    defaultParameters,
    pricing: model.pricing || {},
    architecture,
    capabilities: Array.from(capabilities)
  };
}

export function modelMatchesParameter(modelMeta = {}, paramKey) {
  const schema = PARAM_SCHEMAS[paramKey];
  if (!schema) return false;
  const supported = (modelMeta.supportedParameters || []).map((item) => String(item).toLowerCase());
  if (!supported.length) return true;
  const remoteKeys = [paramKey, schema.requestKey, ...(schema.aliases || [])].map((item) => String(item).toLowerCase());
  return remoteKeys.some((key) => supported.includes(key));
}

function remoteDefaultForParam(modelMeta = {}, paramKey) {
  const schema = PARAM_SCHEMAS[paramKey];
  const defaults = modelMeta.defaultParameters || {};
  for (const key of [paramKey, schema?.requestKey, ...(schema?.aliases || [])]) {
    if (defaults[key] !== undefined) return defaults[key];
  }
  return undefined;
}

export function buildParameterSpecs(provider = "custom", rawModelMeta = {}) {
  const providerSchema = LOCAL_MODEL_SCHEMAS[provider] || LOCAL_MODEL_SCHEMAS.custom;
  const modelMeta = normalizeModelMeta(rawModelMeta, provider);
  const modelSchema = focusModelSchema(provider, modelMeta.id);
  const docEntry = findDocEntryForModel(provider, modelMeta.id) || findDocEntryForModel(provider, modelMeta.name);
  const docParamEntries = Object.entries(docEntry?.category?.modifiable_parameters || {});
  const docSupported = docParamEntries.map(([key]) => normalizeDocParamKey(key)).filter(Boolean);
  const remoteSupported = modelMeta.supportedParameters || [];
  const supportedSource = remoteSupported.length
    ? remoteSupported
    : [
        ...docSupported,
        ...(modelSchema?.supportedParameters || providerSchema.supportedParameters)
      ];
  const supported = Array.from(new Set(
    supportedSource.map((item) => String(item).toLowerCase())
  ));
  const candidates = Object.keys(PARAM_SCHEMAS).filter((key) => {
    const schema = PARAM_SCHEMAS[key];
    const aliases = [key, schema.requestKey, ...(schema.aliases || [])].map((item) => String(item).toLowerCase());
    if (key === "reasoning" || key === "includeReasoning" || key === "reasoningBudget" || key === "reasoningEffort") {
      const hasReasoning = modelMeta.capabilities?.includes("REASONING") || supported.includes("reasoning") || supported.includes("include_reasoning") || supported.includes("reasoning_effort") || supported.includes("reasoningeffort");
      if (!hasReasoning) return false;
    }
    return supported.some((item) => aliases.includes(String(item).toLowerCase()));
  });

  return candidates.map((key) => {
    const schema = PARAM_SCHEMAS[key];
    const docInfo = docParamEntries.find(([rawKey]) => normalizeDocParamKey(rawKey) === key)?.[1];
    const remoteDefault = remoteDefaultForParam(modelMeta, key);
    const source = remoteSupported.length || remoteDefault !== undefined || docInfo ? "provider" : "preset";
    let max = schema.max;
    let defaultValue = remoteDefault ?? docInfo?.default ?? schema.defaultValue;
    if (typeof defaultValue === "string" && /^(null|none)$/i.test(defaultValue.trim())) {
      defaultValue = schema.defaultValue;
    }
    if ((schema.type === "number" || schema.type === "integer") && Number.isFinite(Number(defaultValue))) {
      defaultValue = Number(defaultValue);
    }
    if (schema.type === "enum") {
      const allowed = new Set((schema.options || []).map((option) => String(option.value)));
      if (!allowed.has(String(defaultValue))) defaultValue = schema.defaultValue;
    }
    if (key === "maxTokens") {
      const providerDefault = providerSchema.defaultMaxTokens || schema.defaultValue;
      const remoteMax = modelMeta.maxCompletionTokens || 0;
      const conservative = providerDefault;
      max = Math.min(schema.max, remoteMax || schema.max, GLOBAL_MAX_TOKENS);
      const defaultCandidate = Number.isFinite(Number(remoteDefault))
        ? Number(remoteDefault)
        : Number.isFinite(Number(docInfo?.default))
          ? Number(docInfo.default)
          : Number(conservative);
      defaultValue = Math.min(defaultCandidate || conservative, max);
    }
    return {
      key,
      ...schema,
      tooltip: docInfo?.description || schema.tooltip,
      defaultValue,
      max,
      source
    };
  });
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : fallback;
  return Math.max(min, Math.min(max, safe));
}

function enumValue(value, options = [], fallback = "") {
  const allowed = new Set(options.map((option) => String(option.value)));
  const current = String(value ?? "");
  return allowed.has(current) ? current : String(fallback ?? options[0]?.value ?? "");
}

function requestValueForParam(spec, value) {
  if (spec.key === "responseFormat") {
    if (value === "json_object") return { type: "json_object" };
    if (value === "json_schema") {
      return {
        type: "json_schema",
        json_schema: {
          name: "model_selector_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: true
          }
        }
      };
    }
    return undefined;
  }
  return value;
}

function referenceValueForParam(key, value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (key === "responseFormat" && value === "text") return undefined;
  return value;
}

export function paramValuesEquivalent(left, right) {
  if (left === right) return true;
  if (left === undefined || left === null || left === "") return right === undefined || right === null || right === "";
  if (right === undefined || right === null || right === "") return false;
  if (typeof left === "number" || typeof right === "number") {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber === rightNumber;
  }
  if (typeof left === "boolean" || typeof right === "boolean") return Boolean(left) === Boolean(right);
  if (typeof left === "object" || typeof right === "object") {
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  }
  return String(left) === String(right);
}

export function normalizeParamEnabledForParams(provider = "custom", model = "", params = {}, enabled = {}, modelMeta = null) {
  const meta = normalizeModelMeta(modelMeta || { id: model, name: model }, provider);
  const specs = buildParameterSpecs(provider, meta);
  const mergedParams = mergeModelParams(params);
  const enabledMap = mergeParamEnabled(enabled);
  return Object.fromEntries(
    specs.map((spec) => {
      const value = Object.prototype.hasOwnProperty.call(mergedParams, spec.key)
        ? mergedParams[spec.key]
        : spec.defaultValue;
      const requestValue = referenceValueForParam(spec.key, value);
      const isActualOverride = Boolean(enabledMap[spec.key]) &&
        requestValue !== undefined &&
        !paramValuesEquivalent(value, spec.defaultValue);
      return [spec.key, isActualOverride];
    })
  );
}

function pruneParamsAndEnabledForModel(provider, model, params = {}, enabled = {}) {
  const modelMeta = normalizeModelMeta({ id: model, name: model }, provider);
  const supported = new Set(buildParameterSpecs(provider, modelMeta).map((spec) => spec.key));
  return {
    params: Object.fromEntries(Object.entries(params).filter(([key]) => supported.has(key))),
    enabled: Object.fromEntries(Object.entries(enabled).filter(([key]) => supported.has(key)))
  };
}

function migrateImplicitDefaultEnabled(provider, model, params = {}, enabled = {}, version) {
  if (Number(version || 0) >= PARAM_INTENT_VERSION) return enabled;
  const modelMeta = normalizeModelMeta({ id: model, name: model }, provider);
  const specs = buildParameterSpecs(provider, modelMeta);
  const migrated = { ...enabled };
  for (const spec of specs) {
    if (!migrated[spec.key]) continue;
    const value = Object.prototype.hasOwnProperty.call(params, spec.key) ? params[spec.key] : spec.defaultValue;
    if (String(value) === String(spec.defaultValue)) migrated[spec.key] = false;
  }
  return migrated;
}

export function estimateInputTokens(messages = []) {
  const text = messages.map((message) => message?.content || "").join("\n");
  return Math.ceil(text.length / 3);
}

export function computeSafeModelParams({
  provider = "custom",
  modelMeta = {},
  params = {},
  enabled = {},
  messages = [],
  globalMaxTokens = GLOBAL_MAX_TOKENS,
  affordableMaxTokens
} = {}) {
  const specs = buildParameterSpecs(provider, modelMeta);
  const enabledMap = mergeParamEnabled(enabled);
  const mergedParams = mergeModelParams(params);
  const requestParams = {};
  const preview = [];
  const inputTokens = estimateInputTokens(messages);
  const contextLimit = Number(modelMeta.contextLength || 0);
  const outputLimit = Number(modelMeta.maxCompletionTokens || 0);
  const safetyBuffer = 256;

  for (const spec of specs) {
    if (!enabledMap[spec.key]) continue;
    const hasExplicitValue = Object.prototype.hasOwnProperty.call(mergedParams, spec.key);
    const rawValue = hasExplicitValue ? mergedParams[spec.key] : spec.defaultValue;
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      preview.push({
        key: spec.key,
        label: spec.label,
        requestKey: spec.requestKey,
        userValue: rawValue,
        safeValue: null,
        changed: false,
        omitted: true,
        reason: "未设置，不发送",
        source: spec.source
      });
      continue;
    }
    let safeValue = rawValue;
    let reason = "";
    if (spec.type === "boolean") {
      safeValue = Boolean(rawValue);
    } else if (spec.type === "enum") {
      safeValue = enumValue(rawValue, spec.options, spec.defaultValue);
    } else {
      let max = spec.max;
      if (spec.key === "maxTokens") {
        const byContext = contextLimit ? Math.max(1, contextLimit - inputTokens - safetyBuffer) : globalMaxTokens;
        const byBalance = Number.isFinite(Number(affordableMaxTokens)) ? Number(affordableMaxTokens) : globalMaxTokens;
        max = Math.min(max, outputLimit || max, byContext, globalMaxTokens, byBalance);
        if (Number(rawValue) > max) {
          reason = byBalance < Number(rawValue) ? "余额或额度限制" :
            outputLimit && outputLimit <= max ? "模型输出上限" :
              contextLimit ? "上下文剩余空间" : "全局安全上限";
        }
      }
      safeValue = clampNumber(rawValue, spec.min ?? 0, max, spec.defaultValue);
      if (spec.type === "integer") safeValue = Math.floor(safeValue);
    }
    const requestValue = requestValueForParam(spec, safeValue);
    const omitted = requestValue === undefined;
    if (!omitted) requestParams[spec.requestKey] = requestValue;
    preview.push({
      key: spec.key,
      label: spec.label,
      requestKey: spec.requestKey,
      userValue: rawValue,
      safeValue,
      changed: String(rawValue) !== String(safeValue),
      omitted,
      reason: omitted && !reason ? "默认文本格式，不发送" : reason,
      source: spec.source
    });
  }

  return { params: requestParams, preview, specs };
}

export function defaultProviderConfigs() {
  return Object.fromEntries(
    Object.entries(PROVIDERS).map(([id, provider]) => [
      id,
      id === "openrouter"
        ? { baseUrl: provider.baseUrl, keys: { 1: "" }, siteUrl: "", appName: "Model Selector", modelCache: {} }
        : { baseUrl: provider.baseUrl, keys: {}, apiKey: "", apiToken: "", accountId: "", modelCache: {} }
    ])
  );
}

export function mergeProviderConfigs(saved) {
  const defaults = defaultProviderConfigs();
  if (!saved || typeof saved !== "object") return defaults;

  for (const [provider, config] of Object.entries(saved)) {
    if (!defaults[provider] || !config || typeof config !== "object") continue;
    defaults[provider] = {
      ...defaults[provider],
      ...config,
      modelCache: config.modelCache && typeof config.modelCache === "object" ? config.modelCache : defaults[provider].modelCache,
      keys: provider === "openrouter"
        ? { ...(defaults[provider].keys || {}), ...(config.keys || {}) }
        : config.keys
    };
  }
  return defaults;
}

export function createLibrary(id = COMMON_LIBRARY_ID, name = "通用", providerConfigs = defaultProviderConfigs()) {
  const now = new Date().toISOString();
  return {
    id: normalizeId(id, COMMON_LIBRARY_ID),
    name,
    description: id === COMMON_LIBRARY_ID ? "所有项目默认共用的 API 分组" : "",
    providerConfigs: mergeProviderConfigs(providerConfigs),
    createdAt: now,
    updatedAt: now
  };
}

export function defaultLibraries() {
  return {
    [COMMON_LIBRARY_ID]: createLibrary(COMMON_LIBRARY_ID, "通用")
  };
}

export function mergeLibraries(saved) {
  const libraries = defaultLibraries();
  if (!saved || typeof saved !== "object") return libraries;

  for (const [rawId, rawLibrary] of Object.entries(saved)) {
    if (!rawLibrary || typeof rawLibrary !== "object") continue;
    const id = normalizeId(rawLibrary.id || rawId, COMMON_LIBRARY_ID);
    libraries[id] = {
      ...createLibrary(id, rawLibrary.name || id),
      ...rawLibrary,
      id,
      providerConfigs: mergeProviderConfigs(rawLibrary.providerConfigs)
    };
  }
  return libraries;
}

export function createProjectSelection(projectId = "default") {
  const normalizedProjectId = normalizeId(projectId, "default");
  const provider = "openrouter";
  const model = PROVIDERS.openrouter.defaultModel;
  const modelMeta = normalizeModelMeta({ id: model, name: model }, provider);
  const specs = buildParameterSpecs(provider, modelMeta);
  const supportedKeys = new Set(specs.map((spec) => spec.key));
  return {
    projectId: normalizedProjectId,
    projectCode: createProjectCode(normalizedProjectId),
    libraryId: COMMON_LIBRARY_ID,
    provider,
    keyAlias: "1",
    model,
    strategy: "primary",
    fallbacks: [],
    paramIntentVersion: PARAM_INTENT_VERSION,
    params: Object.fromEntries(specs.map((spec) => [spec.key, spec.defaultValue])),
    paramEnabled: Object.fromEntries(
      Object.entries(defaultParamEnabled()).filter(([key]) => supportedKeys.has(key))
    ),
    updatedAt: new Date().toISOString()
  };
}

function normalizeStrategy(value = "primary") {
  return ["fixed", "primary", "fallback"].includes(String(value || "")) ? String(value) : "primary";
}

function normalizeFallbackSelections(fallbacks = [], primary = {}) {
  if (!Array.isArray(fallbacks)) return [];
  const seen = new Set();
  const primaryKey = [
    primary.libraryId || COMMON_LIBRARY_ID,
    primary.provider || "",
    primary.keyAlias || "",
    normalizeProviderModelId(primary.provider || "", primary.model || "")
  ].join("::");
  return fallbacks
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const provider = PROVIDERS[item.provider] ? item.provider : primary.provider || "openrouter";
      const model = String(item.model || "").trim();
      if (!model) return null;
      return {
        libraryId: normalizeId(item.libraryId || primary.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID),
        provider,
        keyAlias: String(item.keyAlias || (provider === primary.provider ? primary.keyAlias : provider === "openrouter" ? "1" : "main")),
        model
      };
    })
    .filter(Boolean)
    .filter((item) => {
      const key = [
        item.libraryId,
        item.provider,
        item.keyAlias,
        normalizeProviderModelId(item.provider, item.model)
      ].join("::");
      if (key === primaryKey || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function mergeProjects(saved) {
  if (!saved || typeof saved !== "object") return {};
  const projects = {};
  for (const [rawId, rawProject] of Object.entries(saved)) {
    if (!rawProject || typeof rawProject !== "object") continue;
    const projectId = normalizeId(rawProject.projectId || rawId, "default");
    const provider = PROVIDERS[rawProject.provider] ? rawProject.provider : "openrouter";
    const model = String(rawProject.model || "");
    const modelMeta = normalizeModelMeta({ id: model, name: model }, provider);
    const supportedKeys = new Set(buildParameterSpecs(provider, modelMeta).map((spec) => spec.key));
    const params = mergeModelParams(rawProject.params || rawProject.modelParams);
    const hasNewParamIntent = Number(rawProject.paramIntentVersion || 0) >= PARAM_INTENT_VERSION;
    const paramEnabled = hasNewParamIntent
      ? migrateImplicitDefaultEnabled(
          provider,
          model,
          params,
          mergeParamEnabled(rawProject.paramEnabled),
          rawProject.paramIntentVersion
        )
      : {};
    const normalizedParamEnabled = normalizeParamEnabledForParams(provider, model, params, paramEnabled, modelMeta);
    projects[projectId] = {
      ...createProjectSelection(projectId),
      ...rawProject,
      projectId,
      projectCode: String(rawProject.projectCode || rawProject.project_code || fallbackProjectCode(projectId)),
      libraryId: normalizeId(rawProject.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID),
      provider,
      keyAlias: String(rawProject.keyAlias || "1"),
      model,
      strategy: normalizeStrategy(rawProject.strategy),
      fallbacks: normalizeFallbackSelections(rawProject.fallbacks || rawProject.fallbackModels, {
        libraryId: normalizeId(rawProject.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID),
        provider,
        keyAlias: String(rawProject.keyAlias || "1"),
        model
      }),
      paramIntentVersion: PARAM_INTENT_VERSION,
      params: Object.fromEntries(Object.entries(params).filter(([key]) => supportedKeys.has(key))),
      paramEnabled: Object.fromEntries(Object.entries(normalizedParamEnabled).filter(([key]) => supportedKeys.has(key))),
      updatedAt: String(rawProject.updatedAt || new Date().toISOString())
    };
  }
  return projects;
}

export function createSelectionReference(selection = createProjectSelection()) {
  const params = mergeModelParams(selection.params || selection.modelParams);
  const provider = PROVIDERS[selection.provider] ? selection.provider : "openrouter";
  const modelMeta = normalizeModelMeta(selection.modelMeta || { id: selection.model, name: selection.model }, provider);
  const enabled = normalizeParamEnabledForParams(provider, selection.model, params, selection.paramEnabled, modelMeta);
  const supportedKeys = new Set(buildParameterSpecs(provider, modelMeta).map((spec) => spec.key));
  const modelParams = Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => enabled[key] && supportedKeys.has(key))
      .map(([key, value]) => [externalParamKey(key), referenceValueForParam(key, value)])
      .filter(([, value]) => value !== undefined)
  );
  const paramEnabled = Object.fromEntries(
    Object.entries(enabled)
      .filter(([key, value]) => {
        if (!supportedKeys.has(key) || !value) return false;
        return true;
      })
      .map(([key]) => [externalParamKey(key), true])
  );
  return {
    version: SELECTION_REFERENCE_VERSION,
    paramIntentVersion: PARAM_INTENT_VERSION,
    projectCode: String(selection.projectCode || fallbackProjectCode(selection.projectId || "default")),
    libraryId: normalizeId(selection.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID),
    provider,
    keyAlias: String(selection.keyAlias || "1"),
    model: String(selection.model || ""),
    strategy: normalizeStrategy(selection.strategy),
    ...(normalizeStrategy(selection.strategy) === "fallback"
      ? { fallbacks: normalizeFallbackSelections(selection.fallbacks || selection.fallbackModels, { libraryId: selection.libraryId, provider, keyAlias: selection.keyAlias, model: selection.model }) }
      : {}),
    modelParams,
    ...(Object.keys(paramEnabled).length ? { paramEnabled } : {}),
    updatedAt: String(selection.updatedAt || new Date().toISOString())
  };
}

export function mergeSelectionReference(reference = {}, baseSelection = createProjectSelection()) {
  const base = createSelectionReference(baseSelection);
  const provider = PROVIDERS[reference.provider] ? reference.provider : base.provider;
  const model = String(reference.model || PROVIDERS[provider]?.defaultModel || base.model);
  const params = mergeModelParams(reference.modelParams || reference.params);
  const explicitEnabled = mergeParamEnabled(reference.paramEnabled);
  const referenceParamKeys = Object.keys(reference.modelParams || reference.params || {})
    .map((key) => internalParamKey(key))
    .filter((key) => PARAM_SCHEMAS[key]);
  const paramEnabled = migrateImplicitDefaultEnabled(provider, model, params, {
    ...explicitEnabled,
    ...Object.fromEntries(referenceParamKeys.map((key) => [key, true]))
  }, reference.paramIntentVersion);
  const normalizedParamEnabled = normalizeParamEnabledForParams(provider, model, params, paramEnabled);
  return {
    ...base,
    version: Number(reference.version || SELECTION_REFERENCE_VERSION),
    paramIntentVersion: PARAM_INTENT_VERSION,
    projectCode: String(reference.projectCode || reference.project_code || base.projectCode),
    libraryId: normalizeId(reference.libraryId || base.libraryId, COMMON_LIBRARY_ID),
    provider,
    keyAlias: String(reference.keyAlias || base.keyAlias),
    model,
    strategy: normalizeStrategy(reference.strategy || base.strategy),
    fallbacks: normalizeFallbackSelections(reference.fallbacks || reference.fallbackModels || base.fallbacks, {
      libraryId: normalizeId(reference.libraryId || base.libraryId, COMMON_LIBRARY_ID),
      provider,
      keyAlias: String(reference.keyAlias || base.keyAlias),
      model
    }),
    params,
    paramEnabled: normalizedParamEnabled,
    updatedAt: String(reference.updatedAt || base.updatedAt)
  };
}

export function serializeSelectionReference(reference = {}) {
  return JSON.stringify(createSelectionReference(reference));
}

export function parseSelectionReference(value, fallback = null) {
  if (!value) return fallback;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return fallback;
    return createSelectionReference(mergeSelectionReference(parsed));
  } catch {
    return fallback;
  }
}

export function resolveProviderConfig({ library, selection, maskSecrets = false }) {
  const provider = selection.provider || "openrouter";
  const meta = PROVIDERS[provider] || PROVIDERS.custom;
  const rawConfig = mergeProviderConfigs(library?.providerConfigs)[provider] || {};
  const config = clone(rawConfig);
  let apiKey = "";

  if (provider === "openrouter") {
    const alias = String(selection.keyAlias || "1");
    apiKey = config.keys?.[alias] || "";
    config.keyAlias = alias;
    config.apiKey = apiKey;
  } else {
    const alias = String(selection.keyAlias || "main");
    apiKey = config.keys?.[alias] || config.apiKey || config.apiToken || "";
    config.keyAlias = alias;
    config.apiKey = apiKey;
  }

  const active = {
    projectId: selection.projectId,
    projectCode: selection.projectCode,
    libraryId: library?.id || COMMON_LIBRARY_ID,
    provider,
    providerLabel: meta.label,
    model: selection.model || meta.defaultModel || "",
    baseUrl: config.baseUrl || meta.baseUrl || "",
    apiKey,
    headers: {},
    extra: { ...config },
    params: mergeModelParams(selection.params),
    paramEnabled: normalizeParamEnabledForParams(provider, selection.model, selection.params, selection.paramEnabled),
    selectionReference: createSelectionReference(selection)
  };
  const pruned = pruneParamsAndEnabledForModel(provider, active.model, active.params, active.paramEnabled);
  active.params = pruned.params;
  active.paramEnabled = pruned.enabled;

  if (provider === "openrouter") {
    active.headers = {
      ...(config.siteUrl ? { "HTTP-Referer": config.siteUrl } : {}),
      ...(config.appName ? { "X-Title": config.appName } : {})
    };
  }

  if (maskSecrets) {
    active.apiKey = maskSecret(active.apiKey);
    if (active.extra.apiKey) active.extra.apiKey = maskSecret(active.extra.apiKey);
    if (active.extra.apiToken) active.extra.apiToken = maskSecret(active.extra.apiToken);
    if (active.extra.keys) {
      active.extra.keys = Object.fromEntries(
        Object.entries(active.extra.keys).map(([key, value]) => [key, maskSecret(value)])
      );
    }
  }

  return active;
}

export function configuredAliases(providerConfig = {}) {
  const keys = providerConfig.keys && typeof providerConfig.keys === "object" ? providerConfig.keys : {};
  const legacyKey = providerConfig.apiKey || providerConfig.apiToken || "";
  if (legacyKey && !keys.main) keys.main = legacyKey;
  const aliases = Object.keys(keys);
  if (!aliases.length) aliases.push("main");
  return aliases
    .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
    .map((id) => ({ id, configured: Boolean(String(keys[id] || "").trim()) }));
}
