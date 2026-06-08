import {
  STORAGE_KEYS,
  createProjectSelection,
  defaultLibraries,
  mergeLibraries,
  mergeProjects,
  normalizeId
} from "./model-selector-core.js";

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createLocalStorageAdapter(keys = STORAGE_KEYS) {
  return {
    load() {
      const libraries = mergeLibraries(readJson(keys.libraries, defaultLibraries()));
      const projects = mergeProjects(readJson(keys.projects, {}));
      return { libraries, projects };
    },

    save(state) {
      writeJson(keys.libraries, mergeLibraries(state.libraries));
      writeJson(keys.projects, mergeProjects(state.projects));
    }
  };
}

export function ensureProject(state, projectId) {
  const id = normalizeId(projectId, "default");
  if (!state.projects[id]) {
    state.projects[id] = createProjectSelection(id);
  }
  return state.projects[id];
}
