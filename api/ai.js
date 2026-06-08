const { getAiStatus, processSummaryRequest } = require("../lib/summary-core");

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

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, getAiStatus());
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const result = await processSummaryRequest(payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || "AI 请求失败"
    });
  }
};
