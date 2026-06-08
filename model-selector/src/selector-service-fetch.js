const ALLOWED_REMOTE_PREFIX = "https://pn4w9qze.vercel.app/api/";
const LOCAL_SELECTOR_PROXY = "/api/model-selector-remote";

function shouldUseProxy(error) {
  return /failed to fetch|networkerror|load failed/i.test(String(error?.message || error || ""));
}

export async function fetchSelectorService(endpoint, options = {}) {
  try {
    return await fetch(endpoint, options);
  } catch (error) {
    const url = String(endpoint || "");
    if (!url.startsWith(ALLOWED_REMOTE_PREFIX) || !shouldUseProxy(error)) {
      throw error;
    }
    return fetch(LOCAL_SELECTOR_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: url,
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body || ""
      })
    });
  }
}
