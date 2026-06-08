import { mergeLibraries, mergeProjects } from "./model-selector-core.js";
import { fetchSelectorService } from "./selector-service-fetch.js";

const DEFAULT_SELECTOR_STATE_ENDPOINT = "https://pn4w9qze.vercel.app/api/selector-state";

function selectorServiceHeaders(accessToken) {
  const headers = { Accept: "application/json" };
  const token = String(accessToken || "").trim();
  if (token) headers["X-Model-Selector-Token"] = token;
  return headers;
}

export async function loadServiceSelectorState(endpoint = DEFAULT_SELECTOR_STATE_ENDPOINT, accessToken = "") {
  const response = await fetchSelectorService(endpoint, {
    method: "GET",
    headers: selectorServiceHeaders(accessToken)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `模型配置读取失败 (${response.status})`);
  }
  return {
    serviceMode: true,
    user: payload.user || { id: "service-mode", email: "service-mode" },
    libraries: mergeLibraries(payload.libraries),
    projects: mergeProjects(payload.projects)
  };
}

export function createServiceStateStorageAdapter(endpoint = DEFAULT_SELECTOR_STATE_ENDPOINT, initialState = {}, accessToken = "") {
  const state = {
    libraries: mergeLibraries(initialState.libraries),
    projects: mergeProjects(initialState.projects)
  };

  return {
    load() {
      return state;
    },

    async save(nextState) {
      state.libraries = mergeLibraries(nextState.libraries);
      state.projects = mergeProjects(nextState.projects);
      const response = await fetchSelectorService(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...selectorServiceHeaders(accessToken)
        },
        body: JSON.stringify({
          projects: state.projects
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `模型配置保存失败 (${response.status})`);
      }
    }
  };
}
