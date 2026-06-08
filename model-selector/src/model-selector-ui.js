import {
  COMMON_LIBRARY_ID,
  MODEL_PRESETS,
  PROVIDERS,
  buildParameterSpecs,
  computeSafeModelParams,
  createSelectionReference,
  defaultModelParams,
  defaultParamEnabled,
  isModelFreeForProvider,
  maskSecret,
  mergeModelParams,
  mergeParamEnabled,
  modelIdentityKey,
  modelSortKeyForProvider,
  normalizeId,
  normalizeModelMeta,
  normalizeProviderModelId
} from "./model-selector-core.js";
import { createModelRequestPreview } from "./ai-client.js";
import { fetchSelectorService } from "./selector-service-fetch.js";

const DEFAULT_SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackModelsForProvider(provider) {
  return {
    openrouter: MODEL_PRESETS,
    groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    gemini: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
    glm: ["glm-4.5", "glm-4.5-air", "glm-4-flash"],
    cerebras: ["llama-4-scout-17b-16e-instruct", "llama3.1-8b", "llama-3.3-70b"],
    cloudflare: ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-3.1-70b-instruct", "@cf/mistral/mistral-7b-instruct-v0.1"],
    qwen: ["qwen-plus", "qwen-max", "qwen-turbo"],
    requesty: MODEL_PRESETS,
    portkey: ["gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet-latest"],
    custom: [],
    local: ["gpt-5.5"]
  }[provider] || [];
}

function providerConfig(selector, provider) {
  return selector.getProviderConfig(provider) || {};
}

function providerSecret(selector, provider, alias) {
  const config = providerConfig(selector, provider);
  return config.keys?.[alias] || config.apiKey || config.apiToken || "";
}

function customModels(selector, provider) {
  const models = providerConfig(selector, provider).customModels;
  return Array.isArray(models) ? models : [];
}

const modelListCache = new WeakMap();

function modelListSignature(selector, provider, alias) {
  const cache = selector.getCachedModels(provider, alias);
  const custom = customModels(selector, provider);
  return [
    alias,
    cache.source,
    cache.updatedAt,
    cache.models.length,
    custom.length,
    custom.map((model) => model.id || model.name || "").join("|")
  ].join("::");
}

function clearModelListCache(selector, provider = "") {
  const byProvider = modelListCache.get(selector);
  if (!byProvider) return;
  if (provider) byProvider.delete(provider);
  else byProvider.clear();
}

function modelListForProvider(selector, provider) {
  const selection = selector.getSelection();
  const alias = selection.provider === provider ? selection.keyAlias : selector.getAliases(provider)[0]?.id || "main";
  const signature = modelListSignature(selector, provider, alias);
  let byProvider = modelListCache.get(selector);
  if (!byProvider) {
    byProvider = new Map();
    modelListCache.set(selector, byProvider);
  }
  const cached = byProvider.get(provider);
  if (cached?.signature === signature) return cached.models;
  const cache = selector.getCachedModels(provider, alias);
  const fallback = fallbackModelsForProvider(provider).map((id) => ({ id, name: id, source: "preset" }));
  const combined = [
    ...cache.models,
    ...customModels(selector, provider).map((model) => ({ ...model, source: "custom" })),
    ...(cache.models.length ? [] : fallback)
  ];
  const unique = new Map();
  for (const model of combined) {
    const meta = normalizeModelMeta(model, provider);
    if (meta.id && !unique.has(meta.id)) unique.set(meta.id, meta);
  }
  const models = Array.from(unique.values())
    .sort((a, b) => {
      const freeA = isModelFreeForProvider(provider, a.id || a.name || a) ? 0 : 1;
      const freeB = isModelFreeForProvider(provider, b.id || b.name || b) ? 0 : 1;
      if (freeA !== freeB) return freeA - freeB;
      return modelSortKeyForProvider(provider, a).localeCompare(modelSortKeyForProvider(provider, b), "zh-CN", { sensitivity: "base", numeric: true });
    });
  byProvider.set(provider, { signature, models });
  return models;
}

function modelCountForProvider(selector, provider) {
  const selection = selector.getSelection();
  const alias = selection.provider === provider ? selection.keyAlias : selector.getAliases(provider)[0]?.id || "main";
  const cache = selector.getCachedModels(provider, alias);
  const sourceModels = cache.models.length ? cache.models : fallbackModelsForProvider(provider);
  const ids = new Set();
  for (const model of sourceModels) ids.add(String(model.id || model.name || model));
  for (const model of customModels(selector, provider)) ids.add(String(model.id || model.name || model));
  return ids.size;
}

function currentModelMeta(selector) {
  return modelMetaForSelection(selector, selector.getSelection());
}

function modelMetaForSelection(selector, selection = selector.getSelection()) {
  return modelListForProvider(selector, selection.provider).find((model) => model.id === selection.model) ||
    normalizeModelMeta({ id: selection.model, name: selection.model }, selection.provider);
}

function bestModelForProvider(selector, provider, preferred = "") {
  const ids = modelListForProvider(selector, provider).map((model) => model.id);
  if (preferred && ids.includes(preferred)) return preferred;
  const defaultModel = PROVIDERS[provider]?.defaultModel || "";
  if (defaultModel && ids.includes(defaultModel)) return defaultModel;
  return ids[0] || defaultModel;
}

function modelTags(model) {
  const tags = new Set(model.capabilities || ["LLM", "CHAT"]);
  if (model.contextLength) tags.add(`${model.contextLength} ctx`);
  return Array.from(tags).slice(0, 7);
}

function displayTag(tag) {
  const value = String(tag || "");
  const context = value.match(/^(\d+)\s*ctx$/i);
  if (context) {
    const count = Number(context[1]);
    if (count >= 1000) return `${Math.round(count / 1000)}K`;
  }
  return value.toUpperCase();
}

function modelSearchText(provider, model) {
  return [
    provider,
    PROVIDERS[provider]?.label,
    model.id,
    model.name,
    ...(model.capabilities || []),
    ...(modelTags(model) || [])
  ].join(" ").toLowerCase();
}

function sourceLabel(source) {
  return {
    provider: "服务商",
    preset: "本地预设",
    custom: "用户自定义"
  }[source] || source || "预设";
}

function paramValue(params, spec) {
  if (params[spec.key] !== undefined) return params[spec.key];
  return spec.defaultValue;
}

function booleanValue(value) {
  return value === true || value === "true";
}

function isDefaultParamValue(value, spec = {}) {
  const defaultValue = spec.defaultValue;
  if (value === undefined || value === null || value === "") return defaultValue === undefined || defaultValue === null || defaultValue === "";
  if (spec.type === "number" || spec.type === "integer") {
    const left = Number(value);
    const right = Number(defaultValue);
    return Number.isFinite(left) && Number.isFinite(right) ? left === right : String(value) === String(defaultValue);
  }
  if (spec.type === "boolean") return Boolean(value) === Boolean(defaultValue);
  return String(value) === String(defaultValue);
}

function numericParamValue(value, spec) {
  const fallback = Number(spec.defaultValue ?? spec.min ?? 0);
  const number = Number(value);
  const min = Number(spec.min ?? 0);
  const max = Number(spec.max ?? fallback);
  const step = Number(spec.step || 1);
  const safe = Number.isFinite(number) ? number : fallback;
  const clamped = Math.max(min, Math.min(max, safe));
  if (!Number.isFinite(step) || step <= 0) return clamped;
  const precision = Math.max(
    String(step).includes(".") ? String(step).split(".")[1].length : 0,
    String(min).includes(".") ? String(min).split(".")[1].length : 0
  );
  const factor = 10 ** precision;
  const aligned = min + Math.round((clamped - min) / step) * step;
  return Math.round(Math.min(max, Math.max(min, aligned)) * factor) / factor;
}

function createSettingsDraft(selector) {
  const selection = selector.getSelection();
  const modelMeta = modelMetaForSelection(selector, selection);
  const supportedKeys = new Set(buildParameterSpecs(selection.provider, modelMeta).map((spec) => spec.key));
  const params = { ...defaultModelParams(), ...(selector.getModelParams?.() || selection.params || {}) };
  const enabled = { ...defaultParamEnabled(), ...(selector.getParamEnabled?.() || selection.paramEnabled || {}) };
  const supportedEnabled = Object.fromEntries(Object.entries(enabled).filter(([key]) => supportedKeys.has(key)));
  return {
    selection: { ...selection },
    params: Object.fromEntries(Object.entries(params).filter(([key]) => supportedKeys.has(key))),
    enabled: { ...supportedEnabled },
    armed: { ...supportedEnabled }
  };
}

function createDefaultSettingsDraft(selector, selection = selector.getSelection()) {
  const modelMeta = modelMetaForSelection(selector, selection);
  const specs = buildParameterSpecs(selection.provider, modelMeta);
  const enabled = Object.fromEntries(specs.map((spec) => [spec.key, false]));
  return {
    selection: { ...selection },
    params: Object.fromEntries(specs.map((spec) => [spec.key, spec.defaultValue])),
    enabled: { ...enabled },
    armed: { ...enabled }
  };
}

function settingsDraftDirty(selector, draft) {
  if (!draft) return false;
  const currentReference = createSelectionReference(selector.getSelection());
  const draftReference = createSelectionReference({
    ...draft.selection,
    params: draft.params,
    paramEnabled: draft.enabled
  });
  return JSON.stringify(currentReference.modelParams || {}) !== JSON.stringify(draftReference.modelParams || {}) ||
    JSON.stringify(currentReference.paramEnabled || {}) !== JSON.stringify(draftReference.paramEnabled || {}) ||
    currentReference.model !== draftReference.model ||
    currentReference.provider !== draftReference.provider ||
    currentReference.keyAlias !== draftReference.keyAlias;
}

function settingsDraftReference(draft) {
  if (!draft) return createSelectionReference();
  return createSelectionReference({
    ...draft.selection,
    params: draft.params,
    paramEnabled: draft.enabled
  });
}

function settingsRequestPreview(selector, state, modelMeta, params, enabled) {
  const selection = state.settingsDraft?.selection || selector.getSelection();
  const config = selector.getConfigForSelection?.({
    ...selection,
    params,
    paramEnabled: enabled,
    modelMeta
  }) || selector.getActiveConfig?.() || {};
  const previewConfig = modelMeta && typeof config === "object" ? { ...config, modelMeta } : config;
  const previewMessages = state.previewMessages?.length
      ? state.previewMessages
    : [{ role: "user", content: "参数预览" }];
  try {
    const requestPreview = createModelRequestPreview(previewConfig, { messages: previewMessages });
    return { body: requestPreview?.body || {}, error: "" };
  } catch (error) {
    return { body: {}, error: error?.message || "预览失败" };
  }
}

function updateSettingsParamDraft(selector, state, key, value, { commit = true } = {}) {
  if (!state.settingsDraft) return null;
  const spec = buildParameterSpecs(state.settingsDraft.selection.provider, modelMetaForSelection(selector, state.settingsDraft.selection))
    .find((item) => item.key === key) || {};
  const nextValue = commit && (spec.type === "number" || spec.type === "integer")
    ? numericParamValue(value, spec)
    : value;
  state.settingsDraft.params = {
    ...state.settingsDraft.params,
    [key]: nextValue
  };
  state.settingsDraft.enabled = {
    ...state.settingsDraft.enabled,
    [key]: !isDefaultParamValue(nextValue, spec)
  };
  state.settingsDraft.armed = {
    ...state.settingsDraft.armed,
    [key]: true
  };
  state.status = "";
  return { spec, value: nextValue };
}

function sameSelectionSnapshot(left = {}, right = {}) {
  return ["projectId", "libraryId", "provider", "keyAlias", "model", "strategy"]
    .every((key) => String(left[key] || "") === String(right[key] || ""));
}

function hasDirtySettingsDraft(selector, state) {
  return state.panel === "settings" && Boolean(state.settingsDraft) && settingsDraftDirty(selector, state.settingsDraft);
}

function renderIcon(name) {
  return {
    check: "✓",
    close: "×",
    refresh: "↻",
    copy: "⧉",
    settings: "⚙",
    key: "↔",
    back: "←"
  }[name] || "";
}

function keyLabel(alias) {
  return `Key ${String(alias || "main")}`;
}

function strategyLabel(strategy, fallbackCount = 0) {
  const suffix = fallbackCount > 0 ? `（保留 ${fallbackCount} 个备用）` : "";
  if (strategy === "fixed") return `固定${suffix}`;
  if (strategy === "fallback") return fallbackCount > 0 ? `自动切换 ${fallbackCount} 个备用` : "自动切换";
  return `主模型${suffix}`;
}

function isSelectedModel(selection, provider, modelId) {
  return selection.provider === provider &&
    modelIdentityKey(provider, normalizeProviderModelId(provider, selection.model)) ===
      modelIdentityKey(provider, normalizeProviderModelId(provider, modelId));
}

function selectionModelKey(provider, keyAlias, modelId) {
  return [
    provider,
    keyAlias || "main",
    modelIdentityKey(provider, normalizeProviderModelId(provider, modelId))
  ].join("::");
}

function fallbackDisplayLabel(selector, fallback, index) {
  const config = selector.getConfigForSelection?.(fallback, { maskSecrets: true }) || fallback;
  const providerLabel = config.providerLabel || PROVIDERS[fallback.provider]?.label || fallback.provider;
  const modelLabel = config.modelMeta?.name || config.model || fallback.model;
  return {
    title: `${index + 1}. ${modelLabel}`,
    detail: `${providerLabel} 路 ${fallback.keyAlias || "main"}`
  };
}

function renderKeyMenu(selector, provider) {
  const selection = selector.getSelection();
  const aliases = selector.getAliases(provider);
  return `
    <div class="ms-popover" data-ms-popover>
      <div class="ms-popover-head">
        <strong>API 密钥</strong>
        <span>${escapeHtml(PROVIDERS[provider]?.label || provider)}</span>
      </div>
      <div class="ms-key-list">
        ${aliases.map((alias) => {
          const configured = Boolean(providerSecret(selector, provider, alias.id));
          const selected = provider === selection.provider && alias.id === selection.keyAlias;
          return `
            <button class="ms-key-option${selected ? " is-selected" : ""}" type="button" data-ms-switch-key-provider="${escapeHtml(provider)}" data-ms-switch-key="${escapeHtml(alias.id)}">
              <span class="ms-dot${configured ? " is-ok" : ""}"></span>
              <span>${escapeHtml(alias.id)}</span>
              <small>${escapeHtml(configured ? "可用" : "未配置")}</small>
              ${selected ? `<b>${renderIcon("check")}</b>` : ""}
            </button>
          `;
        }).join("")}
      </div>
      <div class="ms-popover-actions">
        <button class="ms-secondary ms-compact" type="button" data-ms-open-add-api="${escapeHtml(provider)}">添加 API 密钥</button>
      </div>
    </div>
  `;
}

function renderModelRows(selector, provider, query, openKeyMenuFor, expanded = true) {
  const selection = selector.getSelection();
  const aliases = selector.getAliases(provider);
  const activeAlias = selection.provider === provider ? selection.keyAlias : aliases.find((alias) => alias.configured)?.id || aliases[0]?.id || "main";
  const secret = providerSecret(selector, provider, activeAlias);
  const fallbackKeys = new Set((selector.getFallbackSelections?.() || [])
    .map((fallback) => selectionModelKey(fallback.provider, fallback.keyAlias, fallback.model)));
  const modelCount = modelCountForProvider(selector, provider);
  const shouldExpand = expanded || Boolean(query);
  const baseModels = shouldExpand ? modelListForProvider(selector, provider) : [];
  const selectedModel = selection.provider === provider
    ? baseModels.find((model) => modelIdentityKey(provider, model.id) === modelIdentityKey(provider, selection.model)) ||
      normalizeModelMeta({ id: selection.model, name: selection.model, source: "selection" }, provider)
    : null;
  const filteredModels = shouldExpand ? baseModels.filter((model) => !query || modelSearchText(provider, model).includes(query)) : [];
  const models = selectedModel && !filteredModels.some((model) => modelIdentityKey(provider, model.id) === modelIdentityKey(provider, selectedModel.id))
    ? [selectedModel, ...filteredModels]
    : filteredModels;

  return `
    <section class="ms-provider-console${shouldExpand ? " is-expanded" : " is-collapsed"}">
      <header class="ms-provider-console-head">
        <div class="ms-provider-identity">
          <div class="ms-provider-titleline">
            <span class="ms-provider-mark">${renderIcon("key")}</span>
            <strong>${escapeHtml(PROVIDERS[provider]?.label || provider)}</strong>
            <span class="ms-latency-pill">0.52 s</span>
            <button class="ms-link-button" type="button" data-ms-refresh>更新</button>
            <button class="ms-ghost-dot" type="button" data-ms-open-reference aria-label="更多">•••</button>
          </div>
          <div class="ms-tags ms-provider-tags">
            <i>LLM</i><i>TEXT EMBEDDING</i>
          </div>
        </div>
        <div class="ms-provider-credential">
          <button class="ms-key-status" type="button" data-ms-toggle-key-menu="${escapeHtml(provider)}">
            <span class="ms-dot${secret ? " is-ok" : ""}"></span>
            <strong>${escapeHtml(activeAlias || "main")}</strong>
          </button>
          <button class="ms-secondary ms-compact" type="button" data-ms-toggle-key-menu="${escapeHtml(provider)}">${renderIcon("settings")} 配置</button>
          ${openKeyMenuFor === provider ? renderKeyMenu(selector, provider) : ""}
        </div>
      </header>

      <div class="ms-provider-toolbar">
        <button class="ms-model-count-button${shouldExpand ? " is-expanded" : ""}" type="button" data-ms-toggle-provider="${escapeHtml(provider)}">${modelCount} 个模型${shouldExpand ? "⌃" : "⌄"}</button>
        <span></span>
        <button class="ms-link-button" type="button" data-ms-toggle-key-menu="${escapeHtml(provider)}">管理凭据</button>
        <button class="ms-link-button" type="button" data-ms-open-custom="${escapeHtml(provider)}">＋ 添加模型</button>
      </div>

      ${selectedModel ? `
        <div class="ms-current-model-strip">
          <strong>当前已选</strong>
          <span>${escapeHtml(selectedModel.name || selectedModel.id)}</span>
          <small>${escapeHtml(selectedModel.id)}</small>
        </div>
      ` : ""}

      ${shouldExpand ? `
        <div class="ms-model-list ms-dify-model-list">
          ${models.length ? models.map((model) => {
            const selected = isSelectedModel(selection, provider, model.id);
            const available = Boolean(secret) || provider === "local";
            const isFallback = fallbackKeys.has(selectionModelKey(provider, activeAlias, model.id));
            return `
              <div class="ms-model-row ms-dify-model-row${selected ? " is-selected" : ""}${available ? "" : " is-disabled"}" role="button" tabindex="0" data-ms-select-provider="${escapeHtml(provider)}" data-ms-select-model="${escapeHtml(model.id)}" data-ms-select-key="${escapeHtml(activeAlias)}"${available ? "" : ` data-ms-needs-key="${escapeHtml(provider)}"`}>
                <span class="ms-dify-model-main">
                  <span class="ms-provider-mark ms-row-mark">${renderIcon("key")}</span>
                  <strong>${escapeHtml(model.name || model.id)}</strong>
                </span>
                <span class="ms-dify-row-actions">
                  ${selected ? `<button class="ms-secondary ms-compact" type="button" data-ms-open-settings>${renderIcon("settings")} 配置</button>` : ""}
                  ${!selected && !isFallback ? `<button class="ms-secondary ms-compact" type="button" data-ms-add-fallback-provider="${escapeHtml(provider)}" data-ms-add-fallback-model="${escapeHtml(model.id)}" data-ms-add-fallback-key="${escapeHtml(activeAlias)}">备用</button>` : ""}
                  ${!selected && isFallback ? `<button class="ms-secondary ms-compact" type="button" disabled>已备用</button>` : ""}
                  <span class="ms-row-toggle${selected ? " is-on" : ""}" aria-hidden="true"></span>
                </span>
                <span class="ms-hover-card">
                  <strong>${escapeHtml(model.name || model.id)}</strong>
                  <code>${escapeHtml(model.id)}</code>
                  <span>${escapeHtml((model.capabilities || []).join(" / "))}</span>
                  <span>上下文：${escapeHtml(model.contextLength || "未知")}</span>
                  <span>供应商：${escapeHtml(PROVIDERS[provider]?.label || provider)}</span>
                  <span>Key：${escapeHtml(activeAlias)}</span>
                </span>
              </div>
            `;
          }).join("") : `
            <div class="ms-empty ms-dify-empty">
              <strong>这个供应商暂时没有模型名单</strong>
              <span>可以刷新模型，或者添加自定义模型。</span>
              <button class="ms-secondary ms-compact" type="button" data-ms-open-custom="${escapeHtml(provider)}">添加自定义模型</button>
            </div>
          `}
        </div>
      ` : `
        <div class="ms-model-collapsed-hint">
          <span>点击模型数量展开列表，或直接搜索模型名称。</span>
        </div>
      `}
    </section>
  `;
}

function renderCurrentSelectionCard(selector) {
  const selection = selector.getSelection();
  const active = selector.getActiveConfig({ maskSecrets: true });
  const model = currentModelMeta(selector);
  const secret = providerSecret(selector, selection.provider, selection.keyAlias);
  const available = Boolean(secret) || selection.provider === "local";
  return `
    <section class="ms-current-model">
      <div>
        <span>当前模型</span>
        <strong>${escapeHtml(active.model || "未选择模型")}</strong>
        <code>${escapeHtml(selection.provider)} 路 ${escapeHtml(keyLabel(selection.keyAlias))} 路 ${escapeHtml(sourceLabel(model.source || "provider"))}</code>
      </div>
      <div class="ms-current-model-side">
        <em class="${available ? "is-ok" : "is-bad"}">${available ? "Key 已配置" : "需要 API Key"}</em>
        <small>${escapeHtml(model.contextLength ? `${model.contextLength} 上下文` : "上下文未知")}</small>
      </div>
    </section>
  `;
}

function renderFallbackPanel(selector) {
  const selection = selector.getSelection();
  const fallbacks = selector.getFallbackSelections();
  const hasFallbacks = fallbacks.length > 0;
  return `
    <section class="ms-fallback-panel">
      <div class="ms-fallback-head">
        <div>
          <strong>自动切换</strong>
          <span>${escapeHtml(selection.strategy === "fallback"
            ? strategyLabel(selection.strategy, fallbacks.length)
            : fallbacks.length > 0
              ? `已保存 ${fallbacks.length} 个备用，切换到自动切换后会按顺序使用`
              : "当前还没启用自动切换")}</span>
        </div>
        <button class="ms-strategy-cycle" type="button" data-ms-cycle-strategy>
          ${selection.strategy === "fallback" ? "正在使用" : "切换策略"}
        </button>
      </div>
      <div class="ms-fallback-chain">
        ${hasFallbacks ? fallbacks.map((fallback, index) => {
          const label = fallbackDisplayLabel(selector, fallback, index);
          return `
            <span class="ms-fallback-node${index === 0 ? " is-primary" : ""}">
              <em>${escapeHtml(label.title)}</em>
              <small>${escapeHtml(label.detail)}</small>
              <button type="button" data-ms-remove-fallback="${index}" aria-label="删除备用">×</button>
            </span>
          `;
        }).join("") : `<em>还没有备用模型。可以在模型列表里点“备用”加入。</em>`}
      </div>
      <div class="ms-fallback-actions">
        <button class="ms-secondary ms-compact" type="button" data-ms-clear-fallback${hasFallbacks ? "" : " disabled"}>清空备用</button>
        <span class="ms-fallback-hint">${selection.strategy === "fallback" ? "当前模型失败后会按顺序尝试这些备用。" : "开启后就会按这里的顺序自动切换。"}</span>
      </div>
    </section>
  `;
}

function renderProvidersDashboard(selector, state, query) {
  const selection = selector.getSelection();
  const providerIds = [
    selection.provider,
    ...Object.keys(PROVIDERS).filter((provider) => provider !== selection.provider)
  ];
  return providerIds.map((provider) => {
    const active = provider === selection.provider;
    const expanded = Boolean(query) || state.expandedProviders?.[provider] || active;
    return `
      <article class="ms-provider-dashboard${active ? " is-active-provider" : ""}${expanded ? " is-expanded" : " is-collapsed"}">
        ${renderModelRows(selector, provider, query, state.openKeyMenuFor, expanded)}
      </article>
    `;
  }).join("");
}

function renderMainPanel(selector, state) {
  const selection = selector.getSelection();
  const active = selector.getActiveConfig({ maskSecrets: true });
  const query = state.search.trim().toLowerCase();

  return `
    <section class="ms-panel ms-workbench ms-main-panel">
      <header class="ms-selector-head">
        <div>
          <h2>选择模型</h2>
          <p>当前项目：${escapeHtml(selection.projectId)} · ${escapeHtml(active.providerLabel)} · ${escapeHtml(active.model || "未选择模型")}</p>
        </div>
        <button class="ms-icon-button" type="button" data-ms-panel-close aria-label="鍏抽棴">${renderIcon("close")}</button>
      </header>

      <div class="ms-scroll-body">
        <label class="ms-search ms-dify-search">
          <span>搜索模型</span>
          <input data-ms-search value="${escapeHtml(state.search)}" placeholder="搜索模型">
          <small>支持模型名称、模型 ID、供应商、能力标签搜索</small>
        </label>

        <div class="ms-strategy ms-dify-strategy">
          <span>使用策略</span>
          <button type="button" data-ms-strategy="fixed" class="${selection.strategy === "fixed" ? "is-active" : ""}">固定使用此模型</button>
          <button type="button" data-ms-strategy="primary" class="${selection.strategy === "primary" ? "is-active" : ""}">保存为主模型</button>
          <button type="button" data-ms-strategy="fallback" class="${selection.strategy === "fallback" ? "is-active" : ""}">自动切换</button>
        </div>

        ${renderFallbackPanel(selector)}

        <div class="ms-model-groups">
          ${renderProvidersDashboard(selector, state, query)}
        </div>
      </div>

      <footer class="ms-bottom-bar">
        <div class="ms-summary">
          <span>当前选择</span>
          <strong>${escapeHtml(active.model || "未选择模型")}</strong>
          <small>${escapeHtml(active.providerLabel)} 路 ${escapeHtml(selection.keyAlias)} 路 ${escapeHtml(strategyLabel(selection.strategy, selection.fallbacks?.length || 0))}</small>
        </div>
        <div class="ms-bottom-actions">
          <button class="ms-secondary" type="button" data-ms-refresh>${state.loading ? "刷新中..." : `${renderIcon("refresh")} 刷新模型`}</button>
          <button class="ms-secondary" type="button" data-ms-open-settings>${renderIcon("settings")} 模型设置</button>
          <button class="ms-secondary" type="button" data-ms-open-reference>${renderIcon("copy")} 查看引用</button>
          <button class="ms-primary" type="button" data-ms-save>保存并关闭</button>
        </div>
      </footer>
      ${state.status ? `<p class="ms-status">${escapeHtml(state.status)}</p>` : ""}
    </section>
  `;
}

function renderAddApiPanel(selector, state) {
  const provider = state.panelProvider || selector.getSelection().provider;
  const meta = PROVIDERS[provider] || PROVIDERS.custom;
  return `
    <section class="ms-panel ms-workbench ms-add-api-panel">
      <header class="ms-selector-head">
        <button class="ms-icon-button" type="button" data-ms-back>${renderIcon("back")}</button>
        <div>
          <h2>添加 API 密钥</h2>
          <p>${escapeHtml(meta.label)} · 新密钥必须测试通过才会保存</p>
        </div>
        <button class="ms-icon-button" type="button" data-ms-panel-close>${renderIcon("close")}</button>
      </header>
      <div class="ms-scroll-body">
        <section class="ms-inline-note">
          <strong>先测试，后保存</strong>
          <span>只有连接成功并拉到模型名单后，才会写入 API 库。业务项目仍然只保存选择引用。</span>
        </section>
        <div class="ms-form-grid">
          <label>
            <span>鍑嵁鍚嶇О / Key Alias</span>
            <input data-ms-new-alias required placeholder="渚嬪 goe銆乶era銆?">
          </label>
          <label>
            <span>API Key</span>
            <input data-ms-new-secret required type="password" placeholder="${escapeHtml(meta.label)} API Key">
          </label>
        </div>
        <details class="ms-advanced-config">
          <summary>高级配置</summary>
          <div class="ms-form-grid">
            <label class="ms-full">
              <span>自定义 API endpoint 地址</span>
              <input data-ms-new-base-url type="url" placeholder="${escapeHtml(meta.baseUrl || "https://.../v1")}">
            </label>
            <label>
              <span>Site URL</span>
              <input data-ms-new-site-url type="url" placeholder="https://your-domain">
            </label>
            <label>
              <span>App Name</span>
              <input data-ms-new-app-name placeholder="Model Selector">
            </label>
          </div>
        </details>
      </div>
      <footer class="ms-bottom-bar">
        <div class="ms-summary"><span>测试通过后保存到 API 库</span><strong>${escapeHtml(meta.label)}</strong></div>
        <div class="ms-bottom-actions">
          <button class="ms-secondary" type="button" data-ms-back>返回</button>
          <button class="ms-primary" type="button" data-ms-test-and-save-api="${escapeHtml(provider)}">${state.loading ? "测试中..." : "测试连接并保存"}</button>
        </div>
      </footer>
      <p class="ms-status">${escapeHtml(state.status || "保存后会自动切换到这个 Key。")}</p>
    </section>
  `;
}

function renderSettingsPanel(selector, state) {
  const liveSelection = selector.getSelection();
  if (!state.settingsDraft) {
    state.settingsDraft = createSettingsDraft(selector);
  } else if (!sameSelectionSnapshot(state.settingsDraft.selection, liveSelection)) {
    state.settingsDraft = createSettingsDraft(selector);
    if (!state.status) state.status = "模型已切换，参数面板已刷新。";
  }
  const selection = state.settingsDraft.selection;
  const modelMeta = modelMetaForSelection(selector, selection);
  const params = { ...defaultModelParams(), ...state.settingsDraft.params };
  const enabled = { ...defaultParamEnabled(), ...state.settingsDraft.enabled };
  const armed = { ...defaultParamEnabled(), ...state.settingsDraft.armed };
  const specs = buildParameterSpecs(selection.provider, modelMeta);
  const dirty = settingsDraftDirty(selector, state.settingsDraft);
  const draftReference = settingsDraftReference(state.settingsDraft);
  const effectiveCount = Object.keys(draftReference.modelParams || {}).length;
  const armedCount = specs.filter((spec) => armed[spec.key]).length;
  const safe = computeSafeModelParams({
    provider: selection.provider,
    modelMeta,
    params,
    enabled,
    messages: state.previewMessages || []
  });
  const requestPreview = settingsRequestPreview(selector, state, modelMeta, params, enabled);
  const finalRequestParams = requestPreview?.body && typeof requestPreview.body === "object"
    ? Object.fromEntries(Object.entries(requestPreview.body).filter(([key]) => !["model", "messages", "stream"].includes(key)))
    : safe.params;
  const settingsCopy = dirty
    ? "\u6709\u672a\u5e94\u7528\u7684\u53c2\u6570\u4fee\u6539\u3002\u70b9\u201c\u5e94\u7528\u4fee\u6539\u201d\u540e\u624d\u4f1a\u5199\u5165\u4e1a\u52a1\u9879\u76ee\u5f15\u7528\u3002"
    : effectiveCount
      ? `\u5f53\u524d\u6709 ${effectiveCount} \u4e2a\u53c2\u6570\u8986\u76d6\u5df2\u751f\u6548\u3002\u5173\u95ed\u5f00\u5173\u53ef\u6062\u590d\u6a21\u578b\u9ed8\u8ba4\u503c\u3002`
      : armedCount
        ? "\u53c2\u6570\u5f00\u5173\u5df2\u6253\u5f00\u3002\u4fee\u6539\u6570\u503c\u540e\u624d\u4f1a\u751f\u6548\uff0c\u5e76\u4f5c\u4e3a\u8986\u76d6\u53c2\u6570\u5199\u5165\u5f15\u7528\u3002"
        : "\u5f53\u524d\u6ca1\u6709\u8986\u76d6\u6a21\u578b\u9ed8\u8ba4\u53c2\u6570\u3002\u4e0d\u6253\u5f00\u65f6\u4f7f\u7528\u6a21\u578b\u9ed8\u8ba4\u8bbe\u7f6e\u3002";
  const previewError = requestPreview?.error || "";

  return `
    <section class="ms-panel ms-workbench">
      <header class="ms-selector-head">
        <button class="ms-icon-button" type="button" data-ms-back>${renderIcon("back")}</button>
        <div>
          <h2>模型参数</h2>
          <p>${escapeHtml(modelMeta.name || selection.model)} · 根据模型能力自动展示</p>
        </div>
        <button class="ms-icon-button" type="button" data-ms-panel-close>${renderIcon("close")}</button>
      </header>
      <div class="ms-scroll-body">
        <p class="ms-settings-note${dirty ? " is-dirty" : ""}">
          ${escapeHtml(settingsCopy)}
        </p>
        <section class="ms-final-preview ms-final-preview-top">
          <div>
            <strong>最终会发送的参数</strong>
            <span>只发送已开启、已修改，并通过请求适配器确认的参数。</span>
          </div>
          ${previewError ? `<p class="ms-settings-error">${escapeHtml(previewError)}</p>` : ""}
          <pre>${escapeHtml(JSON.stringify(finalRequestParams, null, 2))}</pre>
          ${safe.preview.filter((item) => item.changed).map((item) => `
            <p>已裁剪 ${escapeHtml(item.label)}：用户设置 ${escapeHtml(item.userValue)}，安全发送 ${escapeHtml(item.safeValue)}。原因：${escapeHtml(item.reason || "模型限制")}。</p>
          `).join("")}
        </section>
        <div class="ms-param-list">
          ${specs.map((spec) => {
            const value = paramValue(params, spec);
            const isEnabled = Boolean(armed[spec.key]);
            const source = sourceLabel(spec.source);
            const isBoolean = spec.type === "boolean";
            const controlDisabled = !isEnabled;
            return `
              <section class="ms-param-row">
                <div class="ms-param-title">
                  <button class="ms-switch${isEnabled ? " is-on" : ""}" type="button" data-ms-param-enabled-toggle="${escapeHtml(spec.key)}" aria-pressed="${isEnabled ? "true" : "false"}" title="${isEnabled ? "使用覆盖参数" : "使用模型默认参数"}">
                    <span></span>
                  </button>
                  <div>
                    <strong>${escapeHtml(spec.label)}</strong>
                    <small title="${escapeHtml(spec.tooltip)}">${escapeHtml(spec.tooltip)}</small>
                  </div>
                  <em>${escapeHtml(source)}</em>
                </div>
                <div class="ms-param-control${isEnabled ? "" : " is-off"}">
                  ${isBoolean ? `
                    <div class="ms-segmented">
                      <button type="button" data-ms-param-bool="${escapeHtml(spec.key)}" data-ms-param-bool-value="true" class="${booleanValue(value) ? "is-active" : ""}"${controlDisabled ? " disabled" : ""}>True</button>
                      <button type="button" data-ms-param-bool="${escapeHtml(spec.key)}" data-ms-param-bool-value="false" class="${!booleanValue(value) ? "is-active" : ""}"${controlDisabled ? " disabled" : ""}>False</button>
                    </div>
                  ` : spec.type === "enum" ? `
                    <select data-ms-param-select="${escapeHtml(spec.key)}"${controlDisabled ? " disabled" : ""}>
                      ${(spec.options || []).map((option) => `<option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? " selected" : ""}>${escapeHtml(option.label || option.value)}</option>`).join("")}
                    </select>
                  ` : `
                    <input data-ms-param-value="${escapeHtml(spec.key)}" type="range" min="${escapeHtml(spec.min ?? 0)}" max="${escapeHtml(spec.max)}" step="${escapeHtml(spec.step || 1)}" value="${escapeHtml(numericParamValue(value, spec))}"${controlDisabled ? " disabled" : ""}>
                    <input data-ms-param-number="${escapeHtml(spec.key)}" type="number" min="${escapeHtml(spec.min ?? 0)}" max="${escapeHtml(spec.max)}" step="${escapeHtml(spec.step || 1)}" value="${escapeHtml(numericParamValue(value, spec))}"${controlDisabled ? " disabled" : ""}>
                  `}
                </div>
              </section>
            `;
          }).join("") || `<div class="ms-empty"><strong>这个模型没有可配置参数</strong><span>请求时只发送基础 messages 和 model。</span></div>`}
        </div>
      </div>
      <footer class="ms-bottom-bar">
        <div class="ms-summary"><span>当前模型</span><strong>${escapeHtml(selection.model)}</strong><small>${escapeHtml(selection.provider)} · ${escapeHtml(keyLabel(selection.keyAlias))}</small></div>
        <div class="ms-bottom-actions">
          ${dirty ? `<button class="ms-secondary" type="button" data-ms-discard-settings>放弃修改</button>` : ""}
          <button class="ms-secondary" type="button" data-ms-reset-params>恢复默认</button>
          <button class="ms-primary" type="button" data-ms-apply-settings${dirty ? "" : " disabled"}>应用修改</button>
        </div>
      </footer>
      <p class="ms-status">${escapeHtml(state.status || "不打开开关时使用模型默认参数。")}</p>
    </section>
  `;
}

function renderCustomModelPanel(selector, state) {
  const provider = state.panelProvider || selector.getSelection().provider;
  return `
    <section class="ms-panel ms-workbench">
      <header class="ms-selector-head">
        <button class="ms-icon-button" type="button" data-ms-back>${renderIcon("back")}</button>
        <div>
          <h2>添加自定义模型</h2>
          <p>保存后出现在对应供应商分组下</p>
        </div>
        <button class="ms-icon-button" type="button" data-ms-panel-close>${renderIcon("close")}</button>
      </header>
      <div class="ms-scroll-body">
        <div class="ms-form-grid">
          <label>
            <span>供应商 provider</span>
            <select data-ms-custom-provider>
              ${Object.entries(PROVIDERS).map(([id, meta]) => `<option value="${escapeHtml(id)}"${id === provider ? " selected" : ""}>${escapeHtml(meta.label)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>模型类型</span>
            <select data-ms-custom-type>
              ${["Chat", "Completion", "Embedding", "Image"].map((type) => `<option>${type}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>模型名称</span>
            <input data-ms-custom-name required placeholder="渚嬪 My Fast Model">
          </label>
          <label>
            <span>模型 ID</span>
            <input data-ms-custom-id required placeholder="provider/model-id">
          </label>
          <label>
            <span>凭据名称 / Key Alias</span>
            <input data-ms-custom-alias placeholder="留空则使用当前 key">
          </label>
          <label>
            <span>API Key</span>
            <input data-ms-custom-secret type="password" placeholder="如果同时添加新 key，则必须测试通过">
          </label>
          <label class="ms-full">
            <span>自定义 API endpoint 地址</span>
            <input data-ms-custom-base-url type="url" placeholder="https://.../v1">
          </label>
          <label>
            <span>模型上下文长度</span>
            <input data-ms-custom-context type="number" min="0" step="1" placeholder="渚嬪 32768">
          </label>
          <label>
            <span>能力标签</span>
            <input data-ms-custom-tags placeholder="CHAT,TOOLS,VISION,JSON">
          </label>
        </div>
      </div>
      <footer class="ms-bottom-bar">
        <div class="ms-summary"><span>自定义模型</span><strong>不会写入业务项目 API Key</strong></div>
        <div class="ms-bottom-actions">
          <button class="ms-secondary" type="button" data-ms-back>返回</button>
          <button class="ms-primary" type="button" data-ms-save-custom>${state.loading ? "保存中..." : "保存模型"}</button>
        </div>
      </footer>
      <p class="ms-status">${escapeHtml(state.status || "如果填写 API Key，会先测试通过再保存到选择器。")}</p>
    </section>
  `;
}

function renderReferencePanel(selector, state) {
  const reference = selector.getSelectionReference();
  return `
    <section class="ms-panel ms-workbench">
      <header class="ms-selector-head">
        <button class="ms-icon-button" type="button" data-ms-back>${renderIcon("back")}</button>
        <div>
          <h2>业务项目保存引用</h2>
          <p>业务项目只保存这份引用，不保存 API Key。</p>
        </div>
        <button class="ms-icon-button" type="button" data-ms-panel-close>${renderIcon("close")}</button>
      </header>
      <div class="ms-scroll-body">
        <div class="ms-reference ms-reference-large">
          <pre>${escapeHtml(JSON.stringify(reference, null, 2))}</pre>
        </div>
      </div>
      <footer class="ms-bottom-bar">
        <div class="ms-summary"><span>引用版本</span><strong>v${escapeHtml(reference.version)}</strong></div>
        <div class="ms-bottom-actions">
          <button class="ms-secondary" type="button" data-ms-back>收起</button>
          <button class="ms-primary" type="button" data-ms-copy-reference>${renderIcon("copy")} 复制引用</button>
        </div>
      </footer>
      <p class="ms-status">${escapeHtml(state.status || "业务项目只保存引用，不保存 API Key。")}</p>
    </section>
  `;
}

export function mountModelSelector(target, options = {}) {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) throw new Error("Model selector target not found");
  const selector = options.selector;
  if (!selector) throw new Error("mountModelSelector requires a selector instance");

  const state = {
    panel: "main",
    panelProvider: "",
    search: "",
    status: "",
    loading: false,
    openKeyMenuFor: "",
    expandedProviders: {
      [selector.getSelection().provider]: true
    },
    settingsDraft: null
  };

  const notify = () => {
    options.onChange?.(selector.getActiveConfig({ maskSecrets: Boolean(options.maskSecrets) }));
  };

  const setPanel = (panel, provider = "") => {
    state.panel = panel;
    state.panelProvider = provider;
    state.openKeyMenuFor = "";
    if (panel === "settings") {
      state.settingsDraft = createSettingsDraft(selector);
      state.status = "";
    } else if (panel === "main") {
      state.settingsDraft = null;
    }
    render();
  };

  const render = () => {
    root.innerHTML = state.panel === "add-api" ? renderAddApiPanel(selector, state) :
      state.panel === "settings" ? renderSettingsPanel(selector, state) :
        state.panel === "custom" ? renderCustomModelPanel(selector, state) :
          state.panel === "reference" ? renderReferencePanel(selector, state) :
            renderMainPanel(selector, state);
  };

  async function refreshProvider(provider = selector.getSelection().provider) {
    const original = { ...selector.getSelection() };
    const alias = original.provider === provider ? original.keyAlias : selector.getAliases(provider).find((item) => item.configured)?.id || selector.getAliases(provider)[0]?.id || "main";
    const secret = providerSecret(selector, provider, alias);
    if (!secret && provider !== "local") {
      state.openKeyMenuFor = provider;
      state.status = `请先为 ${PROVIDERS[provider]?.label || provider} 添加可用 API Key，再刷新模型。`;
      render();
      return;
    }
    selector.updateSelection({ provider, keyAlias: alias, model: bestModelForProvider(selector, provider, original.model) });
    state.loading = true;
    state.status = `\u6b63\u5728\u5237\u65b0 ${PROVIDERS[provider]?.label || provider} \u7684\u6a21\u578b\u540d\u5355\u3002`;
    render();
    try {
      const payload = await selector.refreshModels(options.modelsEndpoint || DEFAULT_SELECTOR_MODELS_ENDPOINT, {
        accessToken: options.modelSelectorAccessToken || options.accessToken || ""
      });
      selector.setCachedModels(provider, alias, payload.models || [], payload.source || "fallback");
      clearModelListCache(selector, provider);
      if (original.provider === provider) {
        const nextModel = bestModelForProvider(selector, provider, original.model);
        selector.updateSelection({ model: nextModel });
      } else {
        selector.updateSelection(original);
      }
      state.status = payload.source === "live"
        ? `\u5df2\u5b9e\u65f6\u8bfb\u53d6 ${payload.models?.length || 0} \u4e2a\u6a21\u578b\u3002`
        : `\u672a\u80fd\u5b9e\u65f6\u8bfb\u53d6\uff0c\u5df2\u663e\u793a ${payload.models?.length || 0} \u4e2a\u5907\u7528\u6a21\u578b\u3002${payload.error ? `\u539f\u56e0\uff1a${payload.error}` : ""}`;
    } catch (error) {
      selector.updateSelection(original);
      state.status = `\u5237\u65b0\u5931\u8d25\uff1a${error.message}`;
    } finally {
      state.loading = false;
      render();
      notify();
    }
  }

  async function testAndSaveApi(provider, { alias, secret, baseUrl, siteUrl, appName }) {
    const cleanAlias = normalizeId(alias, "");
    if (!cleanAlias || !secret) throw new Error("请填写凭据名称和 API Key。");
    if (providerConfig(selector, provider).keys?.[cleanAlias]) throw new Error(`API「${cleanAlias}」已存在，请换一个名称。`);

    const original = { ...selector.getSelection() };
    const active = selector.getActiveConfig();
    const meta = PROVIDERS[provider] || PROVIDERS.custom;
    const config = { ...providerConfig(selector, provider) };
    const testConfig = {
      ...active,
      provider,
      providerLabel: meta.label,
      model: bestModelForProvider(selector, provider),
      baseUrl: baseUrl || config.baseUrl || meta.baseUrl || "",
      apiKey: secret,
      headers: provider === "openrouter" ? {
        ...(siteUrl ? { "HTTP-Referer": siteUrl } : {}),
        ...(appName ? { "X-Title": appName } : {})
      } : {},
      extra: {
        ...config,
        apiKey: secret,
        apiToken: secret,
        baseUrl: baseUrl || config.baseUrl || meta.baseUrl || "",
        siteUrl: siteUrl || config.siteUrl || "",
        appName: appName || config.appName || "Model Selector"
      }
    };

    const response = await fetchSelectorService(options.modelsEndpoint || DEFAULT_SELECTOR_MODELS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.modelSelectorAccessToken || options.accessToken
          ? { "X-Model-Selector-Token": options.modelSelectorAccessToken || options.accessToken }
          : {})
      },
      body: JSON.stringify(testConfig)
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false || payload.source !== "live") {
      selector.updateSelection(original);
      throw new Error(payload.error || "测试连接失败。");
    }

    if (baseUrl) selector.updateProviderConfig(provider, "baseUrl", baseUrl);
    if (siteUrl) selector.updateProviderConfig(provider, "siteUrl", siteUrl);
    if (appName) selector.updateProviderConfig(provider, "appName", appName);
    const savedAlias = selector.addNamedApi(provider, cleanAlias, secret, { select: true });
    selector.setCachedModels(provider, savedAlias, payload.models || [], "live");
    clearModelListCache(selector, provider);
    selector.updateSelection({
      provider,
      keyAlias: savedAlias,
      model: bestModelForProvider(selector, provider)
    });
    return { alias: savedAlias, count: payload.models?.length || 0 };
  }

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-ms-search]")) {
      state.search = event.target.value;
      render();
      requestAnimationFrame(() => {
        const search = root.querySelector("[data-ms-search]");
        search?.focus?.();
        const position = search?.value?.length || 0;
        search?.setSelectionRange?.(position, position);
      });
      return;
    }

    const range = event.target.closest("[data-ms-param-value]");
    const number = event.target.closest("[data-ms-param-number]");
    if (range || number) {
      const key = (range || number).dataset.msParamValue || (range || number).dataset.msParamNumber;
      const result = updateSettingsParamDraft(selector, state, key, event.target.value, { commit: false });
      if (!result) return;
      const pairedSelector = range ? `[data-ms-param-number="${CSS.escape(key)}"]` : `[data-ms-param-value="${CSS.escape(key)}"]`;
      const paired = root.querySelector(pairedSelector);
      if (paired) {
        const numeric = Number(result.value);
        if (Number.isFinite(numeric)) paired.value = String(numeric);
      }
      const applyButton = root.querySelector("[data-ms-apply-settings]");
      if (applyButton) applyButton.disabled = !settingsDraftDirty(selector, state.settingsDraft);
      const note = root.querySelector(".ms-settings-note");
      if (note) note.classList.toggle("is-dirty", settingsDraftDirty(selector, state.settingsDraft));
      return;
    }
  });

  root.addEventListener("change", (event) => {
    const range = event.target.closest("[data-ms-param-value]");
    const number = event.target.closest("[data-ms-param-number]");
    if (range || number) {
      const key = (range || number).dataset.msParamValue || (range || number).dataset.msParamNumber;
      if (!updateSettingsParamDraft(selector, state, key, event.target.value, { commit: true })) return;
      render();
      return;
    }

    if (event.target.matches("[data-ms-param-enabled]")) {
      if (!state.settingsDraft) return;
      const key = event.target.dataset.msParamEnabled;
      state.settingsDraft.enabled = {
        ...state.settingsDraft.enabled,
        [key]: event.target.checked
      };
      state.settingsDraft.armed = {
        ...state.settingsDraft.armed,
        [key]: event.target.checked
      };
      state.status = "";
      render();
      return;
    }

    const select = event.target.closest("[data-ms-param-select]");
    if (select) {
      if (!state.settingsDraft) return;
      const key = select.dataset.msParamSelect;
      const spec = buildParameterSpecs(state.settingsDraft.selection.provider, modelMetaForSelection(selector, state.settingsDraft.selection))
        .find((item) => item.key === key) || {};
      state.settingsDraft.params = {
        ...state.settingsDraft.params,
        [key]: select.value
      };
      state.settingsDraft.enabled = {
        ...state.settingsDraft.enabled,
        [key]: !isDefaultParamValue(select.value, spec)
      };
      state.settingsDraft.armed = {
        ...state.settingsDraft.armed,
        [key]: true
      };
      state.status = "";
      render();
    }
  });

  root.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-ms-panel-close]");
    if (close) {
      if (hasDirtySettingsDraft(selector, state)) {
      state.status = "有未应用的修改，请先应用或放弃。";
        render();
        return;
      }
      root.closest(".ms-floating-shell")?.querySelector(".ms-floating-close")?.click();
      return;
    }

    if (event.target.closest("[data-ms-back]")) {
      if (hasDirtySettingsDraft(selector, state)) {
        state.status = "有未应用的修改，请先应用或放弃。";
        render();
        return;
      }
      setPanel("main");
      return;
    }

    if (event.target.closest("[data-ms-discard-settings]")) {
      if (!state.settingsDraft) return;
      state.settingsDraft = createSettingsDraft(selector);
      state.status = "已放弃修改。";
      render();
      return;
    }

    const keyToggle = event.target.closest("[data-ms-toggle-key-menu]");
    if (keyToggle) {
      const provider = keyToggle.dataset.msToggleKeyMenu;
      state.openKeyMenuFor = state.openKeyMenuFor === provider ? "" : provider;
      render();
      return;
    }

    const providerToggle = event.target.closest("[data-ms-toggle-provider]");
    if (providerToggle) {
      const provider = providerToggle.dataset.msToggleProvider;
      state.expandedProviders = {
        ...state.expandedProviders,
        [provider]: !state.expandedProviders[provider]
      };
      render();
      return;
    }

    const switchKey = event.target.closest("[data-ms-switch-key]");
    if (switchKey) {
      const provider = switchKey.dataset.msSwitchKeyProvider;
      const keyAlias = switchKey.dataset.msSwitchKey;
      selector.updateSelection({
        provider,
        keyAlias,
        model: bestModelForProvider(selector, provider, selector.getSelection().model)
      });
      state.expandedProviders = {
        ...state.expandedProviders,
        [provider]: true
      };
      state.openKeyMenuFor = "";
      state.status = `已切换到 ${PROVIDERS[provider]?.label || provider} / ${keyAlias}。`;
      render();
      notify();
      return;
    }

    const openAddApi = event.target.closest("[data-ms-open-add-api]");
    if (openAddApi) {
      setPanel("add-api", openAddApi.dataset.msOpenAddApi || selector.getSelection().provider);
      return;
    }

    const openCustom = event.target.closest("[data-ms-open-custom]");
    if (openCustom) {
      setPanel("custom", openCustom.dataset.msOpenCustom || selector.getSelection().provider);
      return;
    }

    if (event.target.closest("[data-ms-open-settings]")) {
      setPanel("settings", selector.getSelection().provider);
      return;
    }

    if (event.target.closest("[data-ms-open-reference]")) {
      setPanel("reference");
      return;
    }

    const paramToggle = event.target.closest("[data-ms-param-enabled-toggle]");
    if (paramToggle) {
      if (!state.settingsDraft) return;
      const key = paramToggle.dataset.msParamEnabledToggle;
      state.settingsDraft.armed = {
        ...state.settingsDraft.armed,
        [key]: !state.settingsDraft.armed[key]
      };
      if (!state.settingsDraft.armed[key]) {
        state.settingsDraft.enabled = {
          ...state.settingsDraft.enabled,
          [key]: false
        };
      }
      state.status = "";
      render();
      return;
    }

    const strategy = event.target.closest("[data-ms-strategy]");
    if (strategy) {
      selector.updateSelection({ strategy: strategy.dataset.msStrategy });
      if (strategy.dataset.msStrategy === "fallback" && !(selector.getFallbackSelections?.().length || 0)) {
        state.status = "自动切换需要先添加至少一个备用模型。";
      } else {
        state.status = "";
      }
      render();
      notify();
      return;
    }

    const cycleStrategy = event.target.closest("[data-ms-cycle-strategy]");
    if (cycleStrategy) {
      const current = selector.getSelection().strategy;
      const next = current === "fixed" ? "primary" : current === "primary" ? "fallback" : "fixed";
      selector.updateSelection({ strategy: next });
      state.status = next === "fallback" && !(selector.getFallbackSelections?.().length || 0)
        ? "还没有备用模型，自动切换需要先添加至少一个备用模型。"
        : "策略已切换。";
      render();
      notify();
      return;
    }

    const addFallback = event.target.closest("[data-ms-add-fallback-provider]");
    if (addFallback) {
      const beforeCount = selector.getFallbackSelections?.().length || 0;
      selector.addFallbackSelection({
        provider: addFallback.dataset.msAddFallbackProvider,
        keyAlias: addFallback.dataset.msAddFallbackKey,
        model: addFallback.dataset.msAddFallbackModel
      });
      const afterCount = selector.getFallbackSelections?.().length || 0;
      selector.updateSelection({ strategy: "fallback" });
      state.status = afterCount > beforeCount ? "已加入备用模型。" : "这个模型已经在备用链里。";
      render();
      notify();
      return;
    }

    const removeFallback = event.target.closest("[data-ms-remove-fallback]");
    if (removeFallback) {
      selector.removeFallbackSelection(removeFallback.dataset.msRemoveFallback);
      state.status = "已移除备用模型。";
      render();
      notify();
      return;
    }

    if (event.target.closest("[data-ms-clear-fallback]")) {
      selector.clearFallbackSelections();
      state.status = "已清空备用模型。";
      render();
      notify();
      return;
    }

    const modelRow = event.target.closest("[data-ms-select-model]");
    if (modelRow) {
      if (modelRow.dataset.msNeedsKey) {
        state.status = `\u5148\u4e3a ${PROVIDERS[modelRow.dataset.msNeedsKey]?.label || modelRow.dataset.msNeedsKey} \u6dfb\u52a0\u53ef\u7528 API Key\u3002`;
        setPanel("add-api", modelRow.dataset.msNeedsKey);
        return;
      }
      selector.updateSelection({
        provider: modelRow.dataset.msSelectProvider,
        keyAlias: modelRow.dataset.msSelectKey,
        model: modelRow.dataset.msSelectModel
      });
      state.expandedProviders = {
        ...state.expandedProviders,
        [modelRow.dataset.msSelectProvider]: true
      };
      state.status = "已选择模型。";
      render();
      notify();
      return;
    }

    const bool = event.target.closest("[data-ms-param-bool]");
    if (bool) {
      if (!state.settingsDraft) return;
      const key = bool.dataset.msParamBool;
      const spec = buildParameterSpecs(state.settingsDraft.selection.provider, modelMetaForSelection(selector, state.settingsDraft.selection))
        .find((item) => item.key === key) || {};
      const value = bool.dataset.msParamBoolValue === "true";
      state.settingsDraft.params = {
        ...state.settingsDraft.params,
        [key]: value
      };
      state.settingsDraft.enabled = {
        ...state.settingsDraft.enabled,
        [key]: !isDefaultParamValue(value, spec)
      };
      state.settingsDraft.armed = {
        ...state.settingsDraft.armed,
        [key]: true
      };
      state.status = "";
      render();
      return;
    }

    if (event.target.closest("[data-ms-reset-params]")) {
      if (!state.settingsDraft) return;
      state.settingsDraft = createDefaultSettingsDraft(selector, state.settingsDraft.selection);
      state.status = "已恢复默认参数。";
      render();
      return;
    }

    if (event.target.closest("[data-ms-apply-settings]")) {
      if (!state.settingsDraft || !settingsDraftDirty(selector, state.settingsDraft)) {
        state.status = "没有需要应用的修改。";
        render();
        return;
      }
      selector.updateSelection({
        params: mergeModelParams(state.settingsDraft.params),
        paramEnabled: mergeParamEnabled(state.settingsDraft.enabled)
      });
      state.settingsDraft = createSettingsDraft(selector);
      state.status = "参数修改已应用。";
      render();
      notify();
      return;
    }

    const testButton = event.target.closest("[data-ms-test-and-save-api]");
    if (testButton) {
      state.loading = true;
      state.status = "正在测试连接并读取模型名单。";
      render();
      try {
        const result = await testAndSaveApi(testButton.dataset.msTestAndSaveApi, {
          alias: root.querySelector("[data-ms-new-alias]")?.value.trim(),
          secret: root.querySelector("[data-ms-new-secret]")?.value.trim(),
          baseUrl: root.querySelector("[data-ms-new-base-url]")?.value.trim(),
          siteUrl: root.querySelector("[data-ms-new-site-url]")?.value.trim(),
          appName: root.querySelector("[data-ms-new-app-name]")?.value.trim()
        });
        state.loading = false;
        state.status = `API「${result.alias}」测试通过，已缓存 ${result.count} 个模型。`;
        setPanel("main");
        notify();
      } catch (error) {
        state.loading = false;
        state.status = error.message;
        render();
      }
      return;
    }

    if (event.target.closest("[data-ms-save-custom]")) {
      const provider = root.querySelector("[data-ms-custom-provider]")?.value || selector.getSelection().provider;
      const name = root.querySelector("[data-ms-custom-name]")?.value.trim();
      const id = root.querySelector("[data-ms-custom-id]")?.value.trim();
      const type = root.querySelector("[data-ms-custom-type]")?.value || "Chat";
      const alias = root.querySelector("[data-ms-custom-alias]")?.value.trim();
      const secret = root.querySelector("[data-ms-custom-secret]")?.value.trim();
      const baseUrl = root.querySelector("[data-ms-custom-base-url]")?.value.trim();
      const contextLength = Number(root.querySelector("[data-ms-custom-context]")?.value || 0);
      const tags = root.querySelector("[data-ms-custom-tags]")?.value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
      if (!name || !id) {
        state.status = "请填写模型名称和模型 ID。";
        render();
        return;
      }
      state.loading = true;
      state.status = "正在保存模型。";
      render();
      try {
        let keyAlias = selector.getSelection().provider === provider ? selector.getSelection().keyAlias : selector.getAliases(provider)[0]?.id || "main";
        if (alias && secret) {
          const result = await testAndSaveApi(provider, { alias, secret, baseUrl });
          keyAlias = result.alias;
        } else if (baseUrl) {
          selector.updateProviderConfig(provider, "baseUrl", baseUrl);
        }
        const config = providerConfig(selector, provider);
        const models = customModels(selector, provider).filter((model) => model.id !== id);
        models.push(normalizeModelMeta({
          id,
          name,
          type,
          contextLength,
          capabilities: tags?.length ? tags : ["LLM", "CHAT"],
          source: "custom"
        }, provider));
        selector.updateProviderConfig(provider, "customModels", models);
        clearModelListCache(selector, provider);
        selector.updateSelection({ provider, keyAlias, model: id });
        state.loading = false;
        state.status = `已添加自定义模型：${id}`;
        setPanel("main");
        notify();
      } catch (error) {
        state.loading = false;
        state.status = error.message;
        render();
      }
      return;
    }

    if (event.target.closest("[data-ms-refresh]")) {
      refreshProvider(selector.getSelection().provider);
      return;
    }

    if (event.target.closest("[data-ms-save]")) {
      selector.save();
      state.status = "已保存。";
      render();
      notify();
      root.closest(".ms-floating-shell")?.querySelector(".ms-floating-close")?.click();
      return;
    }

    if (event.target.closest("[data-ms-copy-reference]")) {
      const text = JSON.stringify(selector.getSelectionReference(), null, 2);
      await navigator.clipboard?.writeText(text);
      state.status = "已复制引用。";
      render();
    }
  });

  render();
  return {
    getActiveConfig(options = {}) {
      return selector.getActiveConfig(options);
    },
    getSelector() {
      return selector;
    },
    render,
    destroy() {
      root.innerHTML = "";
    }
  };
}
