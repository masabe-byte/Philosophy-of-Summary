const http = require("http");
const fs = require("fs");
const path = require("path");
const { getAiStatus, processSummaryRequest } = require("./lib/summary-core");

const root = __dirname;
const preferredPort = Number(process.env.PORT || 4177);
const ALLOWED_SELECTOR_ENDPOINTS = [
  "https://pn4w9qze.vercel.app/api/selector-state",
  "https://pn4w9qze.vercel.app/api/models"
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
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
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function isAllowedSelectorEndpoint(endpoint) {
  const value = String(endpoint || "");
  return ALLOWED_SELECTOR_ENDPOINTS.some((allowed) => value === allowed || value.startsWith(`${allowed}?`));
}

async function handleModelSelectorRemote(req, res) {
  try {
    const body = await readJsonBody(req);
    const endpoint = String(body.endpoint || "");
    const method = String(body.method || "GET").toUpperCase();
    if (!isAllowedSelectorEndpoint(endpoint)) {
      send(res, 400, JSON.stringify({ ok: false, error: "Unsupported selector endpoint" }), "application/json; charset=utf-8");
      return;
    }
    if (method !== "GET" && method !== "POST") {
      send(res, 405, JSON.stringify({ ok: false, error: "Method not allowed" }), "application/json; charset=utf-8");
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
    send(res, response.status, text || "{}", response.headers.get("content-type") || "application/json; charset=utf-8");
  } catch (error) {
    send(res, 502, JSON.stringify({ ok: false, error: error.message || "Selector service proxy failed" }), "application/json; charset=utf-8");
  }
}

function safeFilePath(urlPath) {
  let cleanPath = "";
  try {
    cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return "";
  }
  const relativePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, filePath);
  return relativeToRoot && !relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot) ? filePath : "";
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/ai") {
    if (req.method === "GET") {
      send(res, 200, JSON.stringify(getAiStatus()), "application/json; charset=utf-8");
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, JSON.stringify({ ok: false, error: "Method not allowed" }), "application/json; charset=utf-8");
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const result = await processSummaryRequest(payload);
      send(res, 200, JSON.stringify(result), "application/json; charset=utf-8");
    } catch (error) {
      send(res, error.status || 500, JSON.stringify({
        ok: false,
        error: error.message || "AI 请求失败"
      }), "application/json; charset=utf-8");
    }
    return;
  }

  if (url.pathname === "/api/model-selector-remote") {
    if (req.method !== "POST") {
      send(res, 405, JSON.stringify({ ok: false, error: "Method not allowed" }), "application/json; charset=utf-8");
      return;
    }
    await handleModelSelectorRemote(req, res);
    return;
  }

  const filePath = safeFilePath(req.url || "/");
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not found");
      return;
    }
    send(res, 200, data, mimeTypes[path.extname(filePath)] || "application/octet-stream");
  });
});

function listen(port, attemptsLeft = 10) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0 && !process.env.PORT) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`怎么总结 running at http://localhost:${port}`);
  });
}

listen(preferredPort);
