import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "dist", "public");
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const target = path.normalize(path.join(publicDir, clean));
  if (!target.startsWith(publicDir)) return path.join(publicDir, "index.html");
  return fs.existsSync(target) && fs.statSync(target).isFile()
    ? target
    : path.join(publicDir, "index.html");
}

http.createServer((req, res) => {
  if (!fs.existsSync(publicDir)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Preview files are missing. Run the frontend preview build first.");
    return;
  }

  const file = safeFile(req.url || "/");
  res.writeHead(200, {
    "Content-Type": types[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}).listen(port, "0.0.0.0", () => {
  console.log(`Preview ready: http://localhost:${port}`);
});
