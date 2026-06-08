import { connectFloatingModelSelector } from "./src/connect-model-selector.js?v=model-selector-integration-4";

const DEFAULT_SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";
const DEFAULT_SELECTOR_MODELS_ENDPOINT = "https://pn4w9qze.vercel.app/api/models";
const DEFAULT_SELECTOR_ACCESS_TOKEN = "202306313";

function safeProjectId(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || "default";
}

function defaultProjectCode(projectId) {
  const slug = safeProjectId(projectId).replace(/[^a-z0-9_-]+/gi, "_");
  return `model_selector_${slug}-PLN01`;
}

export async function initPlanModelSelector(options = {}) {
  const projectId = safeProjectId(
    options.projectId ||
    window.PLANNING_PROJECT_ID ||
    new URLSearchParams(window.location.search).get("project") ||
    "default"
  );
  const projectCode = String(
    options.projectCode ||
    window.PLANNING_MODEL_SELECTOR_PROJECT_CODE ||
    defaultProjectCode(projectId)
  ).trim() || defaultProjectCode(projectId);

  const selector = await connectFloatingModelSelector({
    projectId,
    projectCode,
    selectionReference: options.selectionReference || window.PLANNING_MODEL_SELECTION_REFERENCE || null,
    defaultOpen: false,
    position: options.position || "bottom-left",
    buttonText: options.buttonText || "模型",
    title: options.title || "模型选择器",
    subtitle: options.subtitle || "选择 API 分组和模型",
    stateEndpoint: options.stateEndpoint || DEFAULT_SELECTOR_STATE_ENDPOINT,
    modelsEndpoint: options.modelsEndpoint || DEFAULT_SELECTOR_MODELS_ENDPOINT,
    modelSelectorAccessToken: options.modelSelectorAccessToken || DEFAULT_SELECTOR_ACCESS_TOKEN,
    providerIconBaseUrl: options.providerIconBaseUrl || "/model-selector/assets/provider-icons/",
    onChange(activeConfig) {
      window.dispatchEvent(new CustomEvent("plan-model-selector-change", { detail: activeConfig || null }));
      options.onChange?.(activeConfig || null);
    },
    onRuntimeChange(activeConfig) {
      window.dispatchEvent(new CustomEvent("plan-model-selector-runtime-change", { detail: activeConfig || null }));
      options.onRuntimeChange?.(activeConfig || null);
    }
  });

  window.planModelSelector = selector;
  window.dispatchEvent(new CustomEvent("plan-model-selector-ready", { detail: selector }));
  return selector;
}
