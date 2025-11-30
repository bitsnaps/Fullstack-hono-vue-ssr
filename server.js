// server.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import { Hono } from "hono";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";

// -------------------- Hono backend --------------------
const api = new Hono();

api.get("/api/hello", (c) => c.json({ message: "Hello from Hono!" }));

// You can add more endpoints:
// api.post('/api/data', async (c) => { ... })

// -------------------- Helpers to bridge Node <-> Fetch --------------------
async function nodeRequestFromIncomingMessage(req) {
  const origin = `http://${req.headers.host}`;
  const url = new URL(req.url || "/", origin);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  let body = null;
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), {
    method,
    headers,
    body,
  });
}

async function sendNodeResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  res.end(buffer);
}

// -------------------- Static file serving (prod) --------------------
const mimeTypes = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function isStaticAsset(url) {
  const ext = path.extname(url.split('?')[0])
  return !!ext && ext !== '.html'
}

function serveStaticFile(res, urlPath) {
  const pathname = urlPath.split('?')[0] // <--- strip ?...
  const filePath = path.resolve(__dirname, 'dist/client' + pathname)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain')
      res.end('Not found')
      return
    }
    const ext = path.extname(filePath)
    const type = mimeTypes[ext] || 'application/octet-stream'
    res.statusCode = 200
    res.setHeader('Content-Type', type)
    res.end(data)
  })
}

// -------------------- SSR handler --------------------
async function createAppServer() {
  let vite;
  let prodTemplate;
  let prodRender;

  if (!isProd) {
    // Dev: create Vite in middleware mode
    vite = await createViteServer({
      root: __dirname,
      server: {
        middlewareMode: true,
      },
      appType: "custom", // we handle HTML ourselves
    });
  } else {
    // Prod: preload built template & server entry
    const templatePath = path.resolve(__dirname, "dist/client/index.html");
    prodTemplate = fs.readFileSync(templatePath, "utf-8");
    prodRender = (await import("./dist/server/entry-server.js")).render;
  }

  const server = createHttpServer(async (req, res) => {
    try {
      const url = req.url || "/";

      // 1) Hono API routes
      if (url.startsWith('/api')) {
        const honoReq = await nodeRequestFromIncomingMessage(req)
        const honoRes = await api.fetch(honoReq)
        await sendNodeResponse(res, honoRes)
        return
      }

      // 2) Dev: let Vite handle its own assets/HMR endpoints
      // if (
      //   !isProd &&
      //   (url.startsWith('/@vite') ||
      //     url.startsWith('/src/') ||
      //     url.includes('/assets/') ||
      //     url.endsWith('.js') ||
      //     url.endsWith('.css') ||
      //     url.endsWith('.map'))
      // ) {
      //   vite.middlewares(req, res, () => {})
      //   return
      // }

      // 2) DEV: let Vite handle ALL non-API requests first
      if (!isProd) {
        try {
          vite.middlewares(req, res, async () => {
            // Vite didn't handle this. If it's a page request, do SSR.
            const accept = req.headers.accept || ''
            if (accept.includes('text/html')) {
              let template = fs.readFileSync(
                path.resolve(__dirname, 'index.html'),
                'utf-8',
              )
              template = await vite.transformIndexHtml(url, template)

              const { render } = await vite.ssrLoadModule('/src/entry-server.js')
              const appHtml = await render(url)
              const html = template.replace('<!--app-html-->', appHtml)

              res.statusCode = 200
              res.setHeader('Content-Type', 'text/html')
              res.end(html)
            } else {
              // Non-HTML request that Vite didn't handle (e.g. unknown asset)
              res.statusCode = 404
              res.end()
            }
          })
        } catch (e) {
          console.error(e)
          vite.ssrFixStacktrace(e)
          res.statusCode = 500
          res.end('Internal Server Error')
        }
        return
      }
            
      // 3) Prod: serve built static assets
      if (isProd && isStaticAsset(url)) {
        serveStaticFile(res, url);
        return;
      }

      // 4) SSR for all other routes
      if (!isProd) {
        // Dev: use fresh index.html & Vite SSR
        let template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8",
        );
        template = await vite.transformIndexHtml(url, template);

        const { render } = await vite.ssrLoadModule("/src/entry-server.js");
        const appHtml = await render(url);

        const html = template.replace("<!--app-html-->", appHtml);

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      } else {
        // Prod: use pre-built template & server bundle
        const appHtml = await prodRender(url);
        const html = prodTemplate.replace("<!--app-html-->", appHtml);

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      }
    } catch (e) {
      console.error(e);
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(
      `Server running at http://localhost:${port} (${isProd ? "prod" : "dev"})`,
    );
  });
}

createAppServer();
