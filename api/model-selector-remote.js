const ALLOWED_SELECTOR_ENDPOINTS = [
  "https://pn4w9qze.vercel.app/api/selector-state",
  "https://pn4w9qze.vercel.app/api/models"
];

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      const error = new Error("Invalid JSON body");
      error.status = 400;
      return Promise.reject(error);
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        const error = new Error("Request body too large");
        error.status = 413;
        reject(error);
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        const error = new Error("Invalid JSON body");
        error.status = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function isAllowedSelectorEndpoint(endpoint) {
  const value = String(endpoint || "");
  return ALLOWED_SELECTOR_ENDPOINTS.some((allowed) => value === allowed || value.startsWith(`${allowed}?`));
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const endpoint = String(body.endpoint || "");
    const method = String(body.method || "GET").toUpperCase();

    if (!isAllowedSelectorEndpoint(endpoint)) {
      sendJson(res, 400, { ok: false, error: "Unsupported selector endpoint" });
      return;
    }

    if (method !== "GET" && method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const incomingHeaders = body.headers && typeof body.headers === "object" ? body.headers : {};
    const token = incomingHeaders["X-Model-Selector-Token"] || incomingHeaders["x-model-selector-token"] || "";
    const headers = token ? { "X-Model-Selector-Token": String(token) } : {};
    if (method === "POST") headers["Content-Type"] = "application/json";

    const response = await fetch(endpoint, {
      method,
      headers,
      body: method === "POST" ? String(body.body || "{}") : undefined
    });
    const text = await response.text();

    res.statusCode = response.status;
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
    res.end(text || "{}");
  } catch (error) {
    sendJson(res, error.status || 502, {
      ok: false,
      error: error.message || "Selector service proxy failed"
    });
  }
};
