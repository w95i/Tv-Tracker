// Serves the original design files at http://localhost:3200 — run: node design-references/serve.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "originals");
const types = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml" };

http
  .createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
    if (!name) {
      const files = fs.readdirSync(root).map((f) => `<li><a href="/${encodeURIComponent(f)}">${f}</a></li>`).join("");
      res.writeHead(200, { "content-type": types[".html"] }).end(`<!doctype html><title>TVTracker references</title><ul>${files}</ul>`);
      return;
    }
    const file = path.join(root, path.basename(name));
    if (!fs.existsSync(file)) return res.writeHead(404).end("Not found");
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(3200, () => console.log("References on http://localhost:3200"));
