# Countdown Timer — Shopify App

A Shopify app that lets merchants create and display countdown timers on their storefront to drive urgency for promotions and discounts.

Built with the MERN stack (MongoDB, Express, React, Node.js) and Shopify CLI 3.0, per the project requirements document. The storefront widget uses Preact to keep the bundle small.

---

## What it does

-  **Admin panel (embedded in Shopify admin):** Merchants create, edit, search, sort, and delete countdown timers. Built with React + Polaris v13 components.
-  **Storefront widget:** A Preact-based countdown bundled as a theme app extension. Merchants drop the block into their theme via the theme editor; it renders on the storefront and ticks down in real time.
-  **Scheduled activation:** Timers automatically activate and deactivate based on start/end date-times. The widget only renders when a timer is within its active window.
-  **Urgency notifications:** In the last N minutes (default 5) the widget either pulses (color pulse) or shows a banner, depending on the merchant's configuration.
-  **Multi-tenant by design:** Every database query is scoped by shop domain. Multiple Shopify stores can install the app and their data stays completely isolated.

---

## Architecture

```
┌─────────────────────────────┐
│  Shopify Admin (embedded)   │
│  React + Polaris v13        │  Merchants manage timers here
└──────────────┬──────────────┘
               │ authenticated fetch (App Bridge session token)
               ▼
┌─────────────────────────────┐        ┌──────────────┐
│  Node + Express server      │ ◄────► │  MongoDB     │
│  - OAuth via Shopify CLI    │        │  Atlas       │
│  - Authenticated CRUD       │        │              │
│  - Public widget endpoint   │        │  Collections:│
│  - MongoDB session storage  │        │  - sessions  │
└──────────────▲──────────────┘        │  - timers    │
               │                       └──────────────┘
               │ unauthenticated fetch (CORS open, shop param)
               │
┌──────────────┴──────────────┐
│  Preact widget (IIFE)       │
│  ~16 KB minified            │
│  Loaded by theme app        │
│  extension block on         │
│  storefront pages           │
└─────────────────────────────┘
```

### Three-part app structure

| Part              | Folder                                    | Stack                                                  |
| ----------------- | ----------------------------------------- | ------------------------------------------------------ | ------ |
| Backend           | `web/`                                    | Node, Express, Mongoose, Shopify API library           |
| Admin UI          | `web/frontend/`                           | React 18, Vite, Polaris v13, App Bridge                |
| Storefront widget | `widget/` + `extensions/countdown-timer/` | Preact 10, esbuild, Liquid (~17 KB min, ~6 KB gzipped) | Liquid |

### Data model

**`timers` collection** (Mongoose schema in `web/models/Timer.js`):

```js
{
  shop: String (indexed),         // tenancy key — every query filters by this
  name: String,
  startAt: Date,
  endAt: Date,
  promotionDescription: String,
  display: { color, size, position },
  urgency: { type, triggerMinutes },
  scope: { type, productIds },
  enabled: Boolean,
  timestamps: true                // createdAt, updatedAt
}
```

Compound index on `{ shop, enabled, startAt, endAt }` for fast active-timer queries.

**`shopify_sessions` collection** managed by `@shopify/shopify-app-session-storage-mongodb`.

### API surface

| Route                           | Auth            | Purpose                                               |
| ------------------------------- | --------------- | ----------------------------------------------------- |
| `GET /api/timers`               | Session (admin) | List timers for current shop                          |
| `POST /api/timers`              | Session (admin) | Create a timer                                        |
| `GET /api/timers/:id`           | Session (admin) | Read single timer                                     |
| `PUT /api/timers/:id`           | Session (admin) | Update timer                                          |
| `DELETE /api/timers/:id`        | Session (admin) | Delete timer                                          |
| `GET /api/public/timers/active` | Public + CORS   | Return currently-active timer for `?shop=&productId=` |

The public endpoint is mounted **before** `validateAuthenticatedSession` so it bypasses Shopify's session middleware.

---

## Prerequisites

-  Node.js 18+ (developed on v22)
-  [MongoDB Atlas](https://cloud.mongodb.com) free-tier cluster, or local MongoDB
-  [Shopify Partners account](https://partners.shopify.com)
-  Shopify CLI 3.x installed globally (`npm install -g @shopify/cli@latest`)
-  A Shopify development store with a few test products

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Wick-99/countdown-timer-shopify-app.git
cd countdown-timer-shopify-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and paste your MongoDB Atlas connection string. Make sure the URI includes `/countdown_timer` before the query parameters:

```
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/countdown_timer?retryWrites=true&w=majority&appName=Cluster0
```

### 3. Build the widget bundle

```bash
npm run build:widget
```

Produces `extensions/countdown-timer/assets/widget.js` (~16 KB minified Preact IIFE).

### 4. Start the dev server

```bash
shopify app dev
```

The Shopify CLI prompts you to select a Partners org and development store on first run, creates the app in the Dev Dashboard, starts the Cloudflare tunnel, and launches:

-  Express backend (with MongoDB session storage)
-  Vite dev server for the React admin
-  Theme app extension bundler
-  GraphiQL admin API explorer

When it shows `✅ Ready, watching for changes in your app`, press **`p`** to open the app in your dev store's admin.

### 5. Add the block to your storefront theme

1. Shopify admin → **Online Store → Themes** → **Customize**
2. Navigate to a product page or home page
3. **Add section → Apps → Countdown Timer**
4. Click **Save**

The storefront will now show any currently-active timers.

---

## Design decisions

### Why Preact, not React, for the widget?

The PRD specifies Preact. Beyond that — Preact is ~4 KB gzipped vs React's ~45 KB. On a storefront that runs on customers' devices, every KB matters. Using the same React bundle the admin uses would inflate the widget by an order of magnitude for no functional benefit.

### Why a theme app extension instead of ScriptTag API?

The PRD says "make use of the theme app extension." The theme extension approach also gives merchants explicit control over where the widget appears (via theme editor block placement) and gracefully handles app uninstall (the block simply hides).

### Why MongoDB for session storage, not just timers?

Keeps the whole data layer in one place. The reviewer can open Atlas or Compass and see both sessions and timers scoped by shop — easier to verify tenancy at a glance.

### Why an auto-fallback to the script-src origin for the widget's API URL?

During development the Cloudflare tunnel URL changes every `shopify app dev` restart. Forcing the merchant to paste a fresh URL into the theme editor's block settings each time is painful. The widget reads the origin of its own script tag (always fresh because `{{ 'widget.js' | asset_url }}` is re-rendered per request) as a fallback.

---

## Project structure

```
countdown-timer-app/
├── extensions/countdown-timer/       Theme app extension
│   ├── blocks/countdown-timer.liquid
│   └── assets/widget.js              (generated by widget build)
├── web/                              Node + Express backend
│   ├── index.js                      Express entry
│   ├── shopify.js                    Shopify API + Mongo session storage
│   ├── config/db.js                  Mongoose connection
│   ├── models/Timer.js
│   ├── routes/
│   │   ├── timers.js                 Authenticated CRUD
│   │   └── publicTimers.js           Unauthenticated widget API
│   ├── middleware/validateTimer.js
│   └── frontend/                     React admin (Vite + Polaris v13)
│       ├── pages/index.jsx           Timer Manager home
│       ├── components/
│       │   ├── TimerCard.jsx
│       │   ├── TimerFormModal.jsx
│       │   ├── TimerEmptyState.jsx
│       │   └── DeleteConfirmModal.jsx
│       └── hooks/useTimerApi.js
├── widget/                           Preact storefront widget (separate workspace)
│   ├── src/
│   │   ├── index.jsx                 Entry + script-origin fallback
│   │   ├── Widget.jsx                Layout + urgency logic
│   │   ├── Countdown.jsx             Tick loop
│   │   ├── UrgencyBanner.jsx
│   │   ├── api.js
│   │   └── styles.js
│   └── build.mjs                     esbuild IIFE bundler
├── docs/screenshots/                 Screenshots referenced here and in Loom
├── .env.example
├── shopify.app.toml                  Shopify CLI app config
└── README.md
```

---

## Useful commands

```bash
# Start dev server (backend + frontend + extension)
shopify app dev

# Build the storefront widget bundle
npm run build:widget

```

---

## Submission

-  **GitHub repo:** https://github.com/Wick-99/countdown-timer-shopify-app
-  **Loom walkthrough:** https://share.vidyard.com/watch/9wKjtC4Q2Nu7nBxPZsXefR

---
