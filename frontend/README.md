# Alpine Passmanager — Web Client

A frontend for the existing Alpine Passmanager Go API. The master password and
vault key stay in the browser; the server receives only a derived authentication
key and AES-GCM ciphertext. The backend in this repository was not modified.

The interface follows a quiet, graphite-and-lavender visual system with an
editorial landing page, focused auth screens, and a responsive master–detail
vault.

## Contents

- [Features](#features)
- [Stack](#stack)
- [Project structure](#project-structure)
- [Cryptography](#cryptography)
- [Backend API map](#backend-api-map)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Production deployment](#production-deployment)
- [Tests and verification](#tests-and-verification)
- [Security boundaries and known limitations](#security-boundaries-and-known-limitations)
- [Accessibility and responsive behavior](#accessibility-and-responsive-behavior)
- [Routes](#routes)

## Features

- Landing page with product explanation, cryptographic data path, and an
  interactive sample vault that is clearly marked as fictitious.
- Registration with local Argon2id key derivation and an explicit
  no-recovery warning.
- Sign-in with local key derivation, account/password/server error states, and
  automatic lock when the JWT expires.
- Vault master–detail layout:
  - create, view, edit, and delete entries;
  - client-side search across service name and login;
  - A–Z sorting;
  - password reveal with 30-second auto-hide;
  - deliberate copy actions for login and password;
  - per-entry decryption error handling that still permits deletion.
- Full loading, empty, error, and success states.
- Responsive layouts for desktop, tablet, and mobile; mobile uses list/detail
  navigation instead of a split pane.
- Keyboard support: `Ctrl K` / `Cmd K` focuses search, `Esc` closes dialogs, and
  native `<dialog>` focus management is used.
- No secrets, JWTs, or decrypted data in `localStorage`, `sessionStorage`,
  IndexedDB, URLs, toasts, logs, or analytics.

## Stack

| Area | Choice |
| --- | --- |
| UI | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router 7 |
| Icons | Lucide |
| Argon2id | `hash-wasm` |
| Font | `@fontsource-variable/inter` |
| Styling | CSS Modules + centralized design tokens |
| Tests | Vitest + Node integration coverage |

The app intentionally has no state-management, component-library, CSS-in-JS, or
analytics dependency. All API access goes through
`src/lib/api/client.ts`.

## Project structure

```text
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/                     # guards, 404, error boundary
│   ├── components/
│   │   ├── layout/              # public header/footer
│   │   └── ui/                  # buttons, fields, modal, alerts, toasts, logo
│   ├── features/
│   │   ├── auth/                # auth provider, login, register, layout, errors
│   │   ├── landing/             # landing page and sample vault
│   │   └── vault/               # vault page, list, detail, dialogs, data mapping
│   ├── lib/
│   │   ├── api/                 # typed API client and integration test
│   │   ├── crypto/              # Go-compatible crypto and unit tests
│   │   ├── base64.ts
│   │   ├── clipboard.ts
│   │   └── jwt.ts
│   ├── styles/                  # tokens and base/reset styles
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

Key modules:

- `src/lib/crypto/vaultCrypto.ts` — Argon2id, HKDF, verifier, AES-GCM.
- `src/lib/api/client.ts` — exact wire contracts, error parsing, request handling.
- `src/features/auth/AuthProvider.tsx` — in-memory session, expiry timer, auth flows.
- `src/features/vault/VaultPage.tsx` — vault loading, CRUD orchestration, search,
  selection, and dialogs.
- `src/styles/tokens.css` — color, type, spacing, radius, shadow, and motion tokens.

## Cryptography

The browser implementation mirrors `backend/internal/crypto` and was verified
byte-for-byte against the Go implementation with known vectors.

### Key derivation

```text
masterKey = Argon2id(
  password   = UTF-8 master password,
  salt       = 16 random bytes generated at registration,
  iterations = 4,
  memory     = 65,536 KiB (64 MiB),
  threads    = 2,
  keyLen     = 32 bytes
)
```

HKDF-SHA256 with an empty salt separates the master key into two 32-byte keys:

| Key | Info | Purpose |
| --- | --- | --- |
| `authKey` | `auth` | Sent to `POST /login`; server stores/compares its SHA-256 verifier |
| `encryptionKey` | `encryption` | Imported as a non-extractable AES-256-GCM key; never sent |

The stored verifier is:

```text
verifier = SHA-256(authKey)
```

### Registration

1. Generate a 16-byte salt with `crypto.getRandomValues`.
2. Derive `authKey` and `encryptionKey` locally.
3. Send `{username, master_salt: base64(salt), verifier: base64(SHA-256(authKey))}`.
4. Sign in with the derived `authKey`.
5. Keep the AES key in memory only.

If the account is created but automatic sign-in fails, the UI reports that the
vault was created and routes to sign-in instead of implying registration failed.

### Sign-in

1. `POST /getSalt` to obtain the per-user salt.
2. Derive the keys locally.
3. `POST /login` with `{username, auth_key: base64(authKey)}`.
4. Decode the JWT expiry and keep the token and AES key in memory.

### Entry encryption

- Algorithm: AES-256-GCM, 128-bit tag.
- Nonce: 12 random bytes generated for every save and update.
- AAD: none, matching the backend.
- Ciphertext: base64 on the wire, byte arrays in PostgreSQL.
- Only the password is encrypted. Service name and login are stored as plain
  text by the existing backend and the UI says so explicitly.

The browser decrypts entries after fetching them. Undecryptable entries are
shown with a warning and can be deleted, but their password cannot be recovered.

## Backend API map

The Go server listens on `HOST:PORT` (default `0.0.0.0:8080`) and exposes these
routes. It accepts JSON only with exactly `Content-Type: application/json`.

| Method | Path | Auth | Request body | Success response | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/register` | No | `{username, master_salt, verifier}` | `200`, empty body | Base64 fields decode to bytes; duplicates return `500 "Failed to create user"` |
| `POST` | `/getSalt` | No | `{username}` | `200 {salt}` | Unknown username returns `500 "Failed to get salt"` |
| `POST` | `/login` | No | `{username, auth_key}` | `200 {token}` | Wrong verifier returns `403 "Wrong password!"`; JWT is HS256 with a 1-hour expiry |
| `GET` | `/getPasswords` | Bearer | — | `200 {passwords}` | `passwords` may be `null`; records use PascalCase keys: `ID`, `ServiceName`, `Login`, `EncPassword`, `Nonce` |
| `POST` | `/savePassword` | Bearer | `{service_name, login, encrypted_password, nonce}` | `200`, empty body | Server validates non-empty service/login/ciphertext/nonce |
| `POST` | `/updatePassword` | Bearer | `{id, service_name, login, encrypted_password, nonce}` | `200`, empty body | Record must belong to the authenticated user |
| `POST` | `/deletePassword` | Bearer | `{id}` | `200`, empty body | Record must belong to the authenticated user |

Additional backend behavior handled by the client:

- Error responses are JSON-encoded strings (for example `"Wrong password!"`)
  without a JSON content type; the client reads both JSON strings and plain text.
- Missing, malformed, or expired bearer tokens return `401`.
- There is no refresh, logout, pagination, ordering, or revision endpoint.
- There is no CORS middleware, so the app must use the Vite proxy in development
  or a same-origin reverse proxy in production.

## Local development

### Prerequisites

- Node.js 20.19+ (or a newer LTS release supported by Vite 8)
- npm
- PostgreSQL for the backend
- The Go toolchain version declared in `backend/go.mod` (currently Go 1.26.5)

### 1. Start the backend

From the repository root:

```bash
cd backend
export DATABASE_URL='postgres://postgres:12345@localhost:5432/alpine'
export JWT_SECRET='replace-with-a-long-random-secret'
export PORT=8080
go run ./cmd
```

The backend creates its tables on startup. An optional `backend/.env` is read
automatically; environment variables take precedence.

### 2. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

The Vite dev server proxies `/api/*` to `http://localhost:8080/*` and strips the
`/api` prefix. To point somewhere else:

```bash
VITE_DEV_PROXY_TARGET=http://127.0.0.1:18080 npm run dev
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with the API proxy |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (integration test skipped by default) |
| `npm run build` | Typecheck and produce `dist/` |
| `npm run preview` | Serve the built app with the same API proxy |

## Configuration

| Variable | Scope | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Browser build | `/api` | API prefix. Keep `/api` behind the dev proxy or a same-origin reverse proxy. |
| `VITE_DEV_PROXY_TARGET` | Vite only | `http://localhost:8080` | Backend origin for `npm run dev` and `npm run preview`. |

Do not put the backend's JWT secret or database credentials in a `VITE_*`
variable: those values are embedded in the client bundle.

## Production deployment

1. Build:

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. Serve `frontend/dist` as static files with SPA fallback to `index.html`.
3. Reverse-proxy `/api/` to the Go backend and strip the prefix. Example nginx:

   ```nginx
   server {
     listen 443 ssl;
     server_name vault.example.com;

     root /srv/alpine-frontend;
     index index.html;

     location /api/ {
       proxy_pass http://127.0.0.1:8080/;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
     }

     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

4. Terminate TLS in front of both the static app and the API. The app must not
   be used over plain HTTP outside local development.
5. Set conservative cache headers. Hashed Vite assets can be cached for a long
   time; `index.html` and API responses should not be cached.
6. Add a Content-Security-Policy at the reverse proxy if the deployment permits
   it. The app does not rely on inline scripts or third-party analytics.

Because the backend has no CORS support, setting `VITE_API_BASE_URL` to a
different origin will only work if that origin is reachable directly and exposes
CORS. A same-origin reverse proxy is the supported path.

## Tests and verification

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```

Unit tests cover:

- byte-for-byte parity with Go for Argon2id, HKDF auth/encryption keys, and
  verifier derivation;
- AES-256-GCM encrypt/decrypt round trips and authentication failure;
- base64 helpers;
- JWT expiry parsing.

The opt-in real-backend suite registers a unique account, reads its salt, signs
in, exercises wrong-password and invalid-token paths, saves/decrypts/updates/
deletes an entry, and confirms backend error contracts:

```bash
cd frontend
ALPINE_INTEGRATION=1 \
VITE_API_BASE_URL=http://127.0.0.1:18080 \
npx vitest run src/lib/api/integration.test.ts
```

Visual and interaction QA was performed with headless Chromium at 1440×900,
1024×768, and 390×844 against the real Go backend, covering registration, empty
vault, create, search, reveal/copy, edit, wrong password, delete, lock, reload
behavior, and mobile navigation. Axe WCAG 2.0/2.1 A/AA checks reported no
moderate, serious, or critical findings on the landing, register, login, empty
vault, populated vault/detail, and mobile vault screens.

## Security boundaries and known limitations

- **Service and login are plaintext on the server.** Only the password field is
  encrypted. This is a backend schema constraint, not a UI choice.
- **No recovery.** There is no reset flow. Losing the master password means the
  vault cannot be reopened.
- **No persistence of the session.** Reloading or closing the tab signs the user
  out. This is deliberate, but it means every reload requires Argon2id again.
- **Offline guessing is possible if the database leaks.** The salt and
  SHA-256 verifier are stored server-side. A strong, unique master password is
  essential. The UI states this in the security section.
- **XSS is outside this client's threat model.** A compromised page can read
  decrypted values while the vault is unlocked. No client-side encryption can
  prevent that. Use a strict CSP and trusted deployment.
- **Clipboard contents are outside the app's control.** Copy actions are
  explicit and never triggered silently.
- **Backend status quirks:** unknown usernames and duplicate registrations return
  `500` rather than `404`/`409`; the UI maps these cases carefully, but other
  clients should not treat all `500`s as identical.
- **No favorites, folders, settings, import/export, generator, 2FA, recovery, or
  password health features.** The backend does not support them, so they are not
  represented in the UI.
- **No server-side search or ordering.** The client fetches the whole vault and
  searches/sorts in memory.
- **The backend uses one shared PostgreSQL connection.** Concurrent database
  requests can fail with `conn busy`. This client serializes its API requests to
  avoid creating that condition from one tab; simultaneous tabs can still
  collide, and the underlying backend limitation remains.
- **No refresh or logout endpoint.** Locking clears client state only; it does
  not revoke the JWT server-side. The token expires after one hour.
- **No offline mode.** The app requires the backend for salt, auth, and data.
- **The frontend was verified against the real Go server with a temporary
  PostgreSQL instance.** No backend files were changed.

## Accessibility and responsive behavior

- Semantic landmarks, one `h1` per page, visible focus styles, skip link, and
  correctly associated form labels and errors.
- Native `<dialog>` for modals, with `Esc` handling, focus restoration, and
  scroll locking.
- Status announcements for reveal/hide, copy, loading, save, and delete actions.
- Search clear control and accessible names on icon-only buttons.
- `prefers-reduced-motion` disables non-essential transitions and animations.
- Layout breakpoints:
  - ≥ 1121px: sidebar + list + detail.
  - 721–1120px: compact padding; content remains a split pane.
  - ≤ 1023px: sidebar becomes a top bar; the page header exposes “New item”.
  - ≤ 720px: single-pane list/detail navigation with a dedicated back control.
  - ≤ 560px: stacked detail actions; ≤ 390px: reduced gutters and type sizes.

## Routes

| Route | Access | Screen |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public only | Sign in |
| `/register` | Public only | Create vault |
| `/vault` | Authenticated | Vault list and detail |
| `/vault/:id` | Authenticated | Selected entry |
| `*` | Public | Not found |

Authenticated users are redirected away from auth screens; unauthenticated users
are redirected to `/login` from vault routes.
