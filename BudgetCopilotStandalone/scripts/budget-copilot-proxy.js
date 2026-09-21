const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.BUDGET_COPILOT_PORT || 8087);
const CORE42_BASE_URL = "https://api.core42.ai";
const FOUNDRY_RESPONSES_URL =
  "https://foundry-dge-dev-ae.services.ai.azure.com/api/projects/aiproj-ict-dev/openai/v1/responses";
const MAX_BODY_BYTES = 80 * 1024 * 1024;

const routes = new Map([
  ["/api/core42/chat/completions", "/v1/chat/completions"],
  ["/api/core42/responses", "/v1/responses"],
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (routes.has(url.pathname)) {
      await proxyCore42(req, res, routes.get(url.pathname));
      return;
    }

    if (url.pathname === "/api/foundry/responses") {
      await proxyFoundry(req, res);
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Budget Copilot local proxy running at http://localhost:${PORT}/budget-copilot.html`);
});

async function proxyCore42(req, res, upstreamPath) {
  await proxyJsonRequest(req, res, {
    label: "Core42",
    apiKey: req.headers["api-key"] || process.env.CORE42_COMPASS_API_KEY || "",
    url: `${CORE42_BASE_URL}${upstreamPath}`,
  });
}

async function proxyFoundry(req, res) {
  await proxyJsonRequest(req, res, {
    label: "Microsoft Foundry",
    apiKey: req.headers["api-key"] || process.env.FOUNDRY_API_KEY || process.env.AZURE_AI_FOUNDRY_API_KEY || "",
    url: FOUNDRY_RESPONSES_URL,
  });
}

async function proxyJsonRequest(req, res, upstream) {
  if (!["POST", "OPTIONS"].includes(req.method)) {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const body = await readRequestBody(req);

  if (!upstream.apiKey) {
    sendJson(res, 401, {
      error: `${upstream.label} API key is missing. Add it in Settings or set the matching environment variable before starting the proxy.`,
    });
    return;
  }

  const upstreamResponse = await fetch(upstream.url, {
    method: "POST",
    headers: {
      "Content-Type": req.headers["content-type"] || "application/json",
      Accept: req.headers.accept || "application/json",
      "api-key": upstream.apiKey,
    },
    body,
  });

  const headers = {
    ...corsHeaders(),
    "Content-Type": upstreamResponse.headers.get("content-type") || "application/json",
    "Cache-Control": "no-store",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  };

  res.writeHead(upstreamResponse.status, headers);
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  if (!upstreamResponse.body) {
    res.end();
    return;
  }

  const reader = upstreamResponse.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
    }
  } finally {
    res.end();
    reader.releaseLock();
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large for the local proxy."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function serveStatic(urlPath, res) {
  const requestedPath = urlPath === "/" ? "/budget-copilot.html" : decodeURIComponent(urlPath);
  const absolutePath = path.resolve(ROOT, `.${requestedPath}`);

  if (!absolutePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  let stats;
  try {
    stats = await fs.promises.stat(absolutePath);
  } catch {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (!stats.isFile()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const extension = path.extname(absolutePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(absolutePath).pipe(res);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, api-key, Accept",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
