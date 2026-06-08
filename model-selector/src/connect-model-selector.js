const DEFAULT_SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";
const DEFAULT_SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";
const DEFAULT_SELECTOR_ACCESS_TOKEN = "202306313";

function ensureTarget(target) {
  if (target) return target;
  const element = document.createElement("div");
  element.id = "modelSelector";
  document.body.appendChild(element);
  return element;
}

function ensureFloatingHost(options = {}) {
  const existing = (options.container || document.body).querySelector(".ms-floating-host");
  if (existing) {
    const trigger = existing.querySelector(".ms-floating-trigger");
    const shell = existing.querySelector(".ms-floating-shell");
    const title = existing.querySelector(".ms-floating-bar strong");
    const subtitle = existing.querySelector(".ms-floating-bar span");
    if (trigger) {
      trigger.setAttribute("aria-label", options.label || "模型配置");
      const labelSpan = trigger.querySelector("span");
      if (labelSpan) labelSpan.textContent = options.buttonText || "模型";
    }
    if (shell) shell.setAttribute("aria-label", options.label || "模型配置");
    if (title) title.textContent = options.title || "模型选择器";
    if (subtitle) subtitle.textContent = options.subtitle || "选择 API 分组和模型";
    existing.className = `ms-floating-host ms-floating-${options.position || "bottom-right"}`;
    return existing;
  }

  const host = document.createElement("div");
  host.className = `ms-floating-host ms-floating-${options.position || "bottom-right"}`;
  host.innerHTML = `
    <button class="ms-floating-trigger" type="button" aria-expanded="false" aria-label="${options.label || "模型配置"}">
      <span>${options.buttonText || "模型"}</span>
    </button>
    <div class="ms-floating-shell" role="dialog" aria-label="${options.label || "模型配置"}" hidden>
      <div class="ms-floating-bar">
        <div>
          <strong>${options.title || "模型选择器"}</strong>
          <span>${options.subtitle || "选择 API 分组和模型"}</span>
        </div>
        <button class="ms-floating-close" type="button" aria-label="关闭">关闭</button>
      </div>
      <div class="ms-floating-panel"></div>
    </div>
  `;
  (options.container || document.body).appendChild(host);
  return host;
}

export async function connectModelSelector(options = {}) {
  const { mountSupabaseModelSelector } = await import("./model-selector-auth-ui.js");
  const stateEndpoint = options.stateEndpoint || options.serviceStateEndpoint || DEFAULT_SELECTOR_STATE_ENDPOINT;
  const modelsEndpoint = options.modelsEndpoint || DEFAULT_SELECTOR_MODELS_ENDPOINT;
  const modelSelectorAccessToken = options.modelSelectorAccessToken || options.accessToken || DEFAULT_SELECTOR_ACCESS_TOKEN;
  const handle = await mountSupabaseModelSelector(ensureTarget(options.target), {
    projectId: options.projectId || "default",
    projectCode: options.projectCode,
    selectionReference: options.selectionReference,
    modelsEndpoint,
    stateEndpoint,
    modelSelectorAccessToken,
    providerIconBaseUrl: options.providerIconBaseUrl || options.assetBaseUrl,
    maskSecrets: Boolean(options.maskSecrets),
    onChange: options.onChange,
    onRuntimeChange: options.onRuntimeChange
  });

  if (options.globalName) window[options.globalName] = handle;
  return handle;
}

export async function connectFloatingModelSelector(options = {}) {
  const host = ensureFloatingHost(options);
  host.__modelSelectorDetach?.();
  const shell = host.querySelector(".ms-floating-shell");
  const trigger = host.querySelector(".ms-floating-trigger");
  const closeButton = host.querySelector(".ms-floating-close");
  const panel = host.querySelector(".ms-floating-panel");

  const setOpen = (open) => {
    shell.hidden = !open;
    host.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      requestAnimationFrame(() => {
        const search = panel.querySelector("[data-ms-search]");
        search?.focus?.();
        search?.setSelectionRange?.(search.value.length, search.value.length);
      });
    }
  };

  const closeAndReset = () => {
    if (handle?.hasUnsavedTransientEdits?.() && !window.confirm?.("当前有未保存的草稿，关闭会丢弃这些修改。确定关闭吗？")) {
      return;
    }
    handle?.resetTransientState?.();
    setOpen(false);
  };

  const onTriggerClick = () => setOpen(shell.hidden);
  const onCloseClick = () => closeAndReset();
  const onKeydown = (event) => {
    if (event.key === "Escape") closeAndReset();
  };

  trigger.addEventListener("click", onTriggerClick);
  closeButton.addEventListener("click", onCloseClick);
  document.addEventListener("keydown", onKeydown);

  const handle = await connectModelSelector({
    ...options,
    target: panel,
    globalName: options.globalName
  });

  const detach = () => {
    trigger.removeEventListener("click", onTriggerClick);
    closeButton.removeEventListener("click", onCloseClick);
    document.removeEventListener("keydown", onKeydown);
  };
  host.__modelSelectorDetach = detach;

  if (options.defaultOpen) setOpen(true);
  return {
    ...handle,
    open: () => setOpen(true),
    close: () => closeAndReset(),
    toggle: () => setOpen(shell.hidden),
    destroy() {
      detach();
      handle.destroy?.();
      host.remove();
    }
  };
}
