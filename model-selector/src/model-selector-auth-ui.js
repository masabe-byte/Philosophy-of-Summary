import { createModelSelector } from "./model-selector.js";
import {
  createServiceStateStorageAdapter,
  loadServiceSelectorState
} from "./model-selector-supabase.js";
import { mountModelSelector } from "./model-selector-ui.js";

const DEFAULT_SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";
const DEFAULT_SELECTOR_ACCESS_TOKEN = "202306313";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function mountSupabaseModelSelector(target, options = {}) {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) throw new Error("Model selector target not found");

  const stateEndpoint = options.stateEndpoint || options.serviceStateEndpoint || DEFAULT_SELECTOR_STATE_ENDPOINT;
  const accessToken = options.modelSelectorAccessToken || options.accessToken || DEFAULT_SELECTOR_ACCESS_TOKEN;
  let mountedPanel = null;
  let currentSelector = null;
  const listeners = new Set();
  let lastEmittedReference = "";
  let destroyed = false;

  const emit = ({ force = false } = {}) => {
    if (destroyed) return;
    const config = currentSelector?.getActiveConfig({ maskSecrets: Boolean(options.maskSecrets) }) || null;
    const referenceKey = JSON.stringify(config?.selectionReference || null);
    if (!force && referenceKey === lastEmittedReference) return;
    lastEmittedReference = referenceKey;
    options.onChange?.(config);
    for (const listener of listeners) listener(config);
  };

  const emitRuntime = () => {
    if (destroyed) return;
    options.onRuntimeChange?.(currentSelector?.getActiveConfig({ maskSecrets: Boolean(options.maskSecrets) }) || null);
  };

  async function renderService(remoteState) {
    if (destroyed) return;
    const selector = createModelSelector({
      projectId: options.projectId || "demo",
      projectCode: options.projectCode,
      storage: createServiceStateStorageAdapter(stateEndpoint, remoteState, accessToken)
    });
    if (options.selectionReference) selector.applySelectionReference(options.selectionReference);
    currentSelector = selector;

    root.innerHTML = `
      <section class="ms-auth-card">
        <div>
          <strong>已连接统一配置服务</strong>
          <p>${escapeHtml(remoteState.user?.email || "service-mode")}</p>
        </div>
      </section>
      <div data-ms-panel></div>
    `;

    mountedPanel = mountModelSelector(root.querySelector("[data-ms-panel]"), {
      selector,
      modelsEndpoint: options.modelsEndpoint,
      modelSelectorAccessToken: accessToken,
      accessToken,
      providerIconBaseUrl: options.providerIconBaseUrl || options.assetBaseUrl,
      maskSecrets: options.maskSecrets,
      onChange: emit,
      onRuntimeChange: emitRuntime
    });
    emit({ force: true });
  }

  async function renderError(error) {
    if (destroyed) return;
    root.innerHTML = `
      <section class="ms-panel ms-workbench">
        <header class="ms-selector-head">
          <div>
            <h2>模型选择器服务不可用</h2>
            <p>业务项目不会登录 Supabase，只读取远程模型选择器服务。</p>
          </div>
        </header>
        <div class="ms-scroll-body">
          <section class="ms-auth-card">
            <div>
              <strong>当前状态</strong>
              <p>${escapeHtml(error?.message || "服务读取失败")}</p>
            </div>
          </section>
        </div>
        <footer class="ms-bottom-bar">
          <div class="ms-summary">
            <span>连接状态</span>
            <strong>服务读取失败</strong>
            <small>刷新后会再次尝试读取统一配置。</small>
          </div>
          <button class="ms-primary" type="button" data-ms-retry>重试</button>
        </footer>
      </section>
    `;
    root.querySelector("[data-ms-retry]")?.addEventListener("click", render);
  }

  async function render() {
    try {
      root.innerHTML = `<section class="ms-auth-card"><div><strong>正在读取统一配置</strong><p>免登录服务端模式</p></div></section>`;
      const remoteState = await loadServiceSelectorState(stateEndpoint, accessToken);
      await renderService(remoteState);
    } catch (error) {
      await renderError(error);
    }
  }

  await render();

  return {
    isSignedIn() {
      return Boolean(currentSelector);
    },
    getActiveConfig(options = {}) {
      return currentSelector?.getActiveConfig(options) || null;
    },
    getFallbackConfigs(options = {}) {
      return currentSelector?.getFallbackConfigs(options) || [];
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh() {
      return render();
    },
    destroy() {
      destroyed = true;
      mountedPanel?.destroy?.();
      root.innerHTML = "";
      listeners.clear();
    }
  };
}
