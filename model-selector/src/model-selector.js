import {
  COMMON_LIBRARY_ID,
  PARAM_INTENT_VERSION,
  MODEL_PRESETS,
  PROVIDERS,
  buildParameterSpecs,
  configuredAliases,
  createLibrary,
  createProjectCode,
  createSelectionReference,
  defaultParamEnabled,
  mergeLibraries,
  mergeProjects,
  mergeProviderConfigs,
  mergeSelectionReference,
  mergeModelParams,
  mergeParamEnabled,
  modelIdentityKey,
  normalizeId,
  normalizeModelMeta,
  normalizeProviderModelId,
  resolveProviderConfig,
  baseModelsForProvider
} from "./model-selector-core.js";
import { createLocalStorageAdapter, ensureProject } from "./model-selector-storage.js";
import { fetchSelectorService } from "./selector-service-fetch.js";

const DEFAULT_SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";

export * from "./model-selector-core.js";
export {
  chatWithActiveConfig,
  classifyModelRequestError,
  createModelRequestPreview,
  getAssistantText,
  providerCredentialWarning
} from "./ai-client.js";
export { createLocalStorageAdapter } from "./model-selector-storage.js";

export function createModelSelector(options = {}) {
  const storage = options.storage || createLocalStorageAdapter(options.storageKeys);
  const state = storage.load();
  state.libraries = mergeLibraries(state.libraries);
  state.projects = mergeProjects(state.projects);
  let projectId = normalizeId(options.projectId || "default", "default");
  ensureProject(state, projectId);
  if (options.projectCode) {
    selection().projectCode = String(options.projectCode);
  }
  let lastSavePromise = Promise.resolve(true);
  let lastSaveError = null;
  let saveQueue = Promise.resolve();

  const persist = () => {
    const snapshot = JSON.parse(JSON.stringify(state));
    saveQueue = saveQueue
      .catch(() => {})
      .then(() => storage.save(snapshot));
    lastSavePromise = saveQueue
        .then(() => {
          lastSaveError = null;
          return true;
        })
        .catch((error) => {
          lastSaveError = error;
          console.error("Model selector save failed:", error);
          return false;
        });
    return lastSavePromise;
  };
  persist();

  function selection() {
    return ensureProject(state, projectId);
  }

  function defaultParamsForSelection(selectionValue) {
    const activeSelection = selectionValue || selection();
    const modelMeta = normalizeModelMeta({ id: activeSelection.model, name: activeSelection.model }, activeSelection.provider);
    return Object.fromEntries(
      buildParameterSpecs(activeSelection.provider, modelMeta)
        .map((spec) => [spec.key, spec.defaultValue])
    );
  }

  function supportedParamKeys(selectionValue) {
    const activeSelection = selectionValue || selection();
    const modelMeta = normalizeModelMeta({ id: activeSelection.model, name: activeSelection.model }, activeSelection.provider);
    return new Set(buildParameterSpecs(activeSelection.provider, modelMeta).map((spec) => spec.key));
  }

  function pruneParamsForSelection(selectionValue, params = {}) {
    const supported = supportedParamKeys(selectionValue);
    return Object.fromEntries(
      Object.entries(params).filter(([key]) => supported.has(key))
    );
  }

  function pruneEnabledForSelection(selectionValue, enabled = {}) {
    const supported = supportedParamKeys(selectionValue);
    return Object.fromEntries(
      Object.entries(enabled).filter(([key]) => supported.has(key))
    );
  }

  function selectionKey(value = {}) {
    return [
      value.libraryId || selection().libraryId || COMMON_LIBRARY_ID,
      value.provider || "",
      value.keyAlias || "",
      normalizeProviderModelId(value.provider || "", value.model || "")
    ].join("::");
  }

  function compactFallbacks(fallbacks = [], primary = selection()) {
    const seen = new Set();
    const primaryKey = selectionKey(primary);
    return (Array.isArray(fallbacks) ? fallbacks : [])
      .filter((item) => item && item.provider && item.model)
      .map((item) => ({
        libraryId: normalizeId(item.libraryId || primary.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID),
        provider: item.provider,
        keyAlias: String(item.keyAlias || "main"),
        model: String(item.model || "")
      }))
      .filter((item) => {
        const key = selectionKey(item);
        if (key === primaryKey || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }

  function activeLibrary() {
    const current = selection();
    state.libraries = mergeLibraries(state.libraries);
    if (!state.libraries[current.libraryId]) current.libraryId = COMMON_LIBRARY_ID;
    return state.libraries[current.libraryId];
  }

  function libraryForSelection(selectionValue = selection()) {
    state.libraries = mergeLibraries(state.libraries);
    const libraryId = normalizeId(selectionValue.libraryId || COMMON_LIBRARY_ID, COMMON_LIBRARY_ID);
    return state.libraries[libraryId] || state.libraries[COMMON_LIBRARY_ID];
  }

  return {
    providers: PROVIDERS,
    modelPresets: MODEL_PRESETS,

    getState() {
      return state;
    },

    getProjectId() {
      return projectId;
    },

    getProjectCode() {
      return selection().projectCode;
    },

    setProjectId(nextProjectId, options = {}) {
      const currentSelection = { ...selection() };
      projectId = normalizeId(nextProjectId, "default");
      if (options.inheritCurrentSelection) {
        const inherited = {
          ...currentSelection,
          params: pruneParamsForSelection(currentSelection, currentSelection.params),
          paramEnabled: pruneEnabledForSelection(currentSelection, currentSelection.paramEnabled)
        };
        state.projects[projectId] = {
          ...inherited,
          projectId,
          projectCode: options.projectCode || createProjectCode(projectId)
        };
      } else {
        ensureProject(state, projectId);
        if (options.projectCode) selection().projectCode = String(options.projectCode);
      }
      persist();
      return selection();
    },

    getSelection() {
      return selection();
    },

    updateSelection(patch = {}) {
      const current = selection();
      const previousProvider = current.provider;
      const previousModel = normalizeProviderModelId(previousProvider, current.model);
      const shouldTouch = Object.keys(patch)
        .filter((key) => key !== "updatedAt")
        .some((key) => JSON.stringify(current[key]) !== JSON.stringify(patch[key]));
      if (!shouldTouch && !patch.updatedAt) return current;
      if (shouldTouch && !patch.updatedAt) {
        patch = { ...patch, updatedAt: new Date().toISOString() };
      }
      Object.assign(current, patch);
      if (patch.provider && PROVIDERS[patch.provider] && !patch.model) {
        current.model = PROVIDERS[patch.provider].defaultModel || current.model;
      }
      const nextProvider = current.provider;
      const nextModel = normalizeProviderModelId(nextProvider, current.model);
      const modelChanged = previousProvider !== nextProvider || previousModel !== nextModel;
      if (patch.params) {
        current.params = pruneParamsForSelection(current, mergeModelParams(patch.params));
      } else if (modelChanged) {
        current.params = defaultParamsForSelection(current);
      }
      if (patch.paramEnabled) {
        current.paramEnabled = pruneEnabledForSelection(current, mergeParamEnabled(patch.paramEnabled));
      } else if (modelChanged) {
        current.paramEnabled = pruneEnabledForSelection(current, defaultParamEnabled());
      }
      if (patch.fallbacks) {
        current.fallbacks = compactFallbacks(patch.fallbacks, current);
      } else if (modelChanged && Array.isArray(current.fallbacks)) {
        current.fallbacks = compactFallbacks(current.fallbacks, current);
      }
      current.paramIntentVersion = PARAM_INTENT_VERSION;
      persist();
      return current;
    },

    getSelectionReference() {
      const active = this.getActiveConfig();
      return createSelectionReference({ ...selection(), modelMeta: active.modelMeta });
    },

    applySelectionReference(reference = {}) {
      const next = mergeSelectionReference(reference, selection());
      if (reference.modelParams === undefined && reference.params === undefined) {
        delete next.params;
      }
      if (reference.paramEnabled === undefined && reference.modelParams === undefined && reference.params === undefined) {
        delete next.paramEnabled;
      }
      this.updateSelection(next);
      return this.getSelectionReference();
    },

    listLibraries() {
      state.libraries = mergeLibraries(state.libraries);
      return Object.values(state.libraries)
        .sort((a, b) => (a.id === COMMON_LIBRARY_ID ? -1 : b.id === COMMON_LIBRARY_ID ? 1 : a.name.localeCompare(b.name, "zh-CN")));
    },

    createLibrary(name, { copyCurrent = true } = {}) {
      const id = normalizeId(name, COMMON_LIBRARY_ID);
      const providerConfigs = copyCurrent ? activeLibrary().providerConfigs : undefined;
      state.libraries[id] = createLibrary(id, name, providerConfigs);
      selection().libraryId = id;
      persist();
      return state.libraries[id];
    },

    getActiveLibrary() {
      return activeLibrary();
    },

    getProviderConfig(provider = selection().provider) {
      const library = activeLibrary();
      library.providerConfigs = mergeProviderConfigs(library.providerConfigs);
      return library.providerConfigs[provider] || {};
    },

    updateProviderConfig(provider, field, value) {
      const library = activeLibrary();
      const configs = mergeProviderConfigs(library.providerConfigs);
      const config = { ...(configs[provider] || {}) };
      if (field.startsWith("keys.")) {
        const alias = field.slice("keys.".length);
        config.keys = { ...(config.keys || {}) };
        config.keys[alias] = value;
      } else {
        config[field] = value;
      }
      configs[provider] = config;
      library.providerConfigs = configs;
      library.updatedAt = new Date().toISOString();
      persist();
      return config;
    },

    addKeyAlias(provider = "openrouter") {
      const config = this.getProviderConfig(provider);
      const keys = config.keys && typeof config.keys === "object" ? config.keys : {};
      const numericKeys = Object.keys(keys).map((id) => Number(id)).filter(Number.isFinite);
      const next = String(Math.max(0, ...numericKeys) + 1);
      this.updateProviderConfig(provider, `keys.${next}`, "");
      this.updateSelection({ keyAlias: next });
      return next;
    },

    addNamedApi(provider, name, secret, options = {}) {
      const alias = normalizeId(name, "");
      if (!alias) throw new Error("先给 API 命名");
      const value = String(secret || "").trim();
      if (!value) throw new Error("API Key 不能为空");
      const currentConfig = this.getProviderConfig(provider);
      if (currentConfig.keys?.[alias]) {
        throw new Error(`API「${alias}」已存在，请换一个名称`);
      }
      this.updateProviderConfig(provider, `keys.${alias}`, value);
      if (options.select !== false) {
        this.updateSelection({ provider, keyAlias: alias });
      }
      return alias;
    },

    updateNamedApi(provider, originalAlias, name, secret, options = {}) {
      const oldAlias = normalizeId(originalAlias, "");
      const alias = normalizeId(name, "");
      if (!oldAlias) throw new Error("找不到要修改的 API");
      if (!alias) throw new Error("先给 API 命名");
      const value = String(secret || "").trim();
      if (!value) throw new Error("API Key 不能为空");
      const currentConfig = this.getProviderConfig(provider);
      const keys = { ...(currentConfig.keys || {}) };
      if (alias !== oldAlias && keys[alias]) {
        throw new Error(`API「${alias}」已存在，请换一个名称`);
      }
      delete keys[oldAlias];
      keys[alias] = value;
      this.updateProviderConfig(provider, "keys", keys);
      if (options.select !== false || selection().provider === provider && selection().keyAlias === oldAlias) {
        this.updateSelection({ provider, keyAlias: alias });
      }
      return alias;
    },

    deleteNamedApi(provider, alias) {
      const cleanAlias = normalizeId(alias, "");
      if (!cleanAlias) throw new Error("找不到要删除的 API");
      const currentConfig = this.getProviderConfig(provider);
      const keys = { ...(currentConfig.keys || {}) };
      const modelCache = { ...(currentConfig.modelCache || {}) };
      delete keys[cleanAlias];
      delete modelCache[cleanAlias];
      this.updateProviderConfig(provider, "keys", keys);
      this.updateProviderConfig(provider, "modelCache", modelCache);
      if (selection().provider === provider && selection().keyAlias === cleanAlias) {
        const sortedAliases = Object.keys(keys).sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
        const nextAlias = sortedAliases.find((id) => String(keys[id] || "").trim()) || sortedAliases[0] || "main";
        this.updateSelection({ keyAlias: nextAlias });
      }
      return cleanAlias;
    },

    getAliases(provider = "openrouter") {
      return configuredAliases(this.getProviderConfig(provider));
    },

    getCachedModels(provider = selection().provider, keyAlias = selection().keyAlias) {
      const config = this.getProviderConfig(provider);
      const cache = config.modelCache?.[String(keyAlias || "main")];
      return {
        models: Array.isArray(cache?.models) ? cache.models : [],
        source: cache?.source || "none",
        updatedAt: cache?.updatedAt || ""
      };
    },

    setCachedModels(provider, keyAlias, models = [], source = "live") {
      const config = this.getProviderConfig(provider);
      const nextCache = {
        ...(config.modelCache || {}),
        [String(keyAlias || "main")]: {
          models: Array.isArray(models) ? models : [],
          source,
          updatedAt: new Date().toISOString()
        }
      };
      this.updateProviderConfig(provider, "modelCache", nextCache);
      return this.getCachedModels(provider, keyAlias);
    },

    getModelParams() {
      return mergeModelParams(selection().params);
    },

    getParamEnabled() {
      return mergeParamEnabled(selection().paramEnabled);
    },

    updateModelParams(patch = {}) {
      const next = mergeModelParams({ ...selection().params, ...patch });
      this.updateSelection({ params: next });
      return next;
    },

    updateParamEnabled(patch = {}) {
      const next = mergeParamEnabled({ ...selection().paramEnabled, ...patch });
      this.updateSelection({ paramEnabled: next });
      return next;
    },

    getActiveConfig(options = {}) {
      const current = selection();
      const cache = this.getCachedModels(current.provider, current.keyAlias);
      const baseModels = baseModelsForProvider(current.provider).map((id) => normalizeModelMeta({ id, name: id, source: "preset" }, current.provider));
      const knownModels = [
        ...baseModels,
        ...cache.models,
        ...((this.getProviderConfig(current.provider).customModels || []).map((item) => normalizeModelMeta(item, current.provider)))
      ];
      const requestModel = normalizeProviderModelId(current.provider, current.model);
      const requestKey = modelIdentityKey(current.provider, requestModel);
      const modelMeta = knownModels.find((item) => modelIdentityKey(current.provider, item.id || item.name) === requestKey) ||
        normalizeModelMeta({ id: current.model, name: current.model }, current.provider);
      const hasModelIndex = cache.source !== "none" && knownModels.length > 0;
      const resolved = resolveProviderConfig({
        library: libraryForSelection(current),
        selection: current,
        maskSecrets: Boolean(options.maskSecrets)
      });
      return {
        ...resolved,
        model: requestModel || resolved.model,
        modelMeta,
        modelAvailable: !hasModelIndex || knownModels.some((item) => modelIdentityKey(current.provider, item.id || item.name) === requestKey),
        modelCacheSource: cache.source,
        modelCacheUpdatedAt: cache.updatedAt
      };
    },

    getFallbackSelections() {
      return compactFallbacks(selection().fallbacks, selection());
    },

    addFallbackSelection(item = {}) {
      const current = selection();
      const fallback = {
        libraryId: item.libraryId || current.libraryId,
        provider: item.provider || current.provider,
        keyAlias: item.keyAlias || current.keyAlias,
        model: item.model || current.model
      };
      const next = compactFallbacks([...(current.fallbacks || []), fallback], current);
      this.updateSelection({
        strategy: "fallback",
        fallbacks: next
      });
      return selection().fallbacks;
    },

    removeFallbackSelection(index) {
      const next = [...(selection().fallbacks || [])];
      next.splice(Number(index), 1);
      this.updateSelection({ fallbacks: compactFallbacks(next, selection()) });
      return selection().fallbacks;
    },

    clearFallbackSelections() {
      this.updateSelection({ fallbacks: [] });
      return [];
    },

    getFallbackConfigs(options = {}) {
      return this.getFallbackSelections().map((fallback) => this.getConfigForSelection(fallback, options));
    },

    getConfigForSelection(patch = {}, options = {}) {
      const current = { ...selection(), ...patch };
      const cache = this.getCachedModels(current.provider, current.keyAlias);
      const baseModels = baseModelsForProvider(current.provider).map((id) => normalizeModelMeta({ id, name: id, source: "preset" }, current.provider));
      const knownModels = [
        ...baseModels,
        ...cache.models,
        ...((this.getProviderConfig(current.provider).customModels || []).map((item) => normalizeModelMeta(item, current.provider)))
      ];
      const requestModel = normalizeProviderModelId(current.provider, current.model);
      const requestKey = modelIdentityKey(current.provider, requestModel);
      const modelMeta = knownModels.find((item) => modelIdentityKey(current.provider, item.id || item.name) === requestKey) ||
        normalizeModelMeta({ id: current.model, name: current.model }, current.provider);
      const hasModelIndex = cache.source !== "none" && knownModels.length > 0;
      const resolved = resolveProviderConfig({
        library: libraryForSelection(current),
        selection: current,
        maskSecrets: Boolean(options.maskSecrets)
      });
      return {
        ...resolved,
        model: requestModel || resolved.model,
        modelMeta,
        modelAvailable: !hasModelIndex || knownModels.some((item) => modelIdentityKey(current.provider, item.id || item.name) === requestKey),
        modelCacheSource: cache.source,
        modelCacheUpdatedAt: cache.updatedAt
      };
    },

    async refreshModels(endpoint = DEFAULT_SELECTOR_MODELS_ENDPOINT, options = {}) {
      const activeConfig = this.getActiveConfig();
      const response = await fetchSelectorService(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.accessToken || options.modelSelectorAccessToken
            ? { "X-Model-Selector-Token": options.accessToken || options.modelSelectorAccessToken }
            : {})
        },
        body: JSON.stringify(activeConfig)
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "模型列表读取失败");
      }
      return payload;
    },

    async save() {
      const ok = await persist();
      if (!ok || lastSaveError) {
        throw lastSaveError || new Error("模型配置保存失败");
      }
      return true;
    },

    getLastSaveError() {
      return lastSaveError;
    }
  };
}
