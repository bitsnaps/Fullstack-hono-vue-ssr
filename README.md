# Full Stack Hono + Vue 3 SSR App

Below is a complete, single-project setup for a full‑stack app:

- Backend: **Hono**
- Frontend: **Vue 3 + vue-router**
- Tooling: **Vite + pnpm**
- One **Node process** that runs **both backend and frontend in dev** (no `concurrently`).
- **SSR** for SEO.
- All in **JavaScript**, single `package.json`, no pnpm workspaces.
- Build with one command.

---

## 1. Create the project and install dependencies

```bash
mkdir hono-vue-ssr
cd hono-vue-ssr

pnpm init -y
```

Make sure to edit the `package.json` and add `"type": "module"` so we can use `import` in Node if needed.

### Install runtime deps

```bash
pnpm add hono vue vue-router @vue/server-renderer
```

### Install dev deps

```bash
pnpm add -D vite @vitejs/plugin-vue cross-env
```

Node 18+ is required for Vite 5 (and for the built-in `fetch`/`Request`/`Response` we use in Node).

---

## 2. Vite config (Vue + alias)

See `vite.config.js` at the project root.

---

## 3. Base HTML template (SSR placeholder)

See `index.html` in the project root.

Note: `<!--app-html-->` is where server-rendered HTML will be injected.

---

## 4. Vue app (SSR-ready) setup

Create structure:

```bash
mkdir -p src/pages src/router
```

### 4.1 Shared app factory (`src/main.js`)

See `src/main.js`.

### 4.2 Router (`src/router/index.js`)

```js
// src/router/index.js
import Home from '../pages/Home.vue'
import About from '../pages/About.vue'

export default [
  { path: '/', component: Home },
  { path: '/about', component: About },
]
```

### 4.3 App shell (`src/App.vue`)

See `src/App.vue`.


### 4.4 Pages

See `src/pages/Home.vue`

See `src/pages/About.vue`.


### 4.5 Client entry (`src/entry-client.js`)

See `src/entry-client.js`

### 4.6 Server entry (`src/entry-server.js`)

See `src/entry-server.js`.

---

## 5. Hono backend + Node SSR server

We’ll run a **single Node process** that:

- Serves Hono API routes on `/api/*`.
- Integrates Vite in dev mode for bundling/HMR.
- Renders Vue on the server (SSR) for all other routes.
- Serves static built assets in production.

See `server.js`.

Notes:

- In **dev**, Vite runs in **middlewareMode**, providing HMR and transforming your SSR entry. Only one Node process is started.
- In **prod**, we never start Vite; the server uses `dist/client/index.html` and the server bundle in `dist/server/entry-server.js`.

---

## 6. Scripts in `package.json`

See `package.json`.

- `pnpm dev` – starts one Node process that:
  - runs Hono backend on `/api`
  - uses Vite in middleware mode
  - SSR-renders Vue pages
- `pnpm build` – builds client + server bundles for the whole app in `dist/`.
- `pnpm preview` – runs the same Node server in production mode using the built assets.

No pnpm workspace, no `concurrently` – everything is controlled from a single `server.js`.

---

## 7. Running and building

### Dev mode

```bash
pnpm dev
```

Open: `http://localhost:3000/`

- `/` is SSR-rendered Vue Home page.
- `/about` is SSR-rendered About page.
- `/api/hello` is a JSON endpoint served by Hono.

### Build + production mode

```bash
pnpm build
pnpm preview
# or: PORT=8080 pnpm preview
```

Now the app uses the pre-built bundles, still with SSR, and can be deployed anywhere that can run `node server.js` (Render, Railway, Fly, Heroku-style, plain VPS, etc.).