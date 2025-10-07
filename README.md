# Hack Your Own Web

Hack Your Own Web is a front-end for an educational web vulnerability scanning platform. It walks learners through verifying domains, scheduling targeted scans for common issues like SQL injection and cross-site scripting, and reviewing findings with AI-assisted remediation guidance—all in a polished, production-style UI.

## Features
- Domain onboarding and ownership verification with DNS token instructions and clipboard helpers.
- Executive dashboard summarizing domain coverage, recent scan activity, and outstanding critical issues.
- Guided scan creation flows that let users choose targets and vulnerability checks before launch.
- Detailed scan reporting pages with status badges, severity indicators, and contextual next steps.
- Mocked API powered by Mock Service Worker (MSW) so the experience works end-to-end without a live backend.
- Responsive, dark-mode aware interface built with shadcn/ui (Radix primitives) and Tailwind CSS.

## Tech Stack
- React 18.3.1 with TypeScript 5.8 (React DOM 18.3.1)
- Vite 5.4 (SWC) tooling
- React Router 6.30 for routing
- TanStack Query 5.83 for data fetching, caching, and mutations
- Tailwind CSS 3.4 with class-variance-authority 0.7 and tailwind-merge 2.6
- Mock Service Worker (MSW) 2.6 for local API mocking
- ESLint 9 with TypeScript project references for static analysis

## Getting Started

### Prerequisites
- Node.js 18.0.0 or newer (Vite 5 requirement)
- pnpm 8.0.0 or newer

If pnpm is not installed, enable it via Corepack:

```bash
corepack enable
```

### Installation

```bash
pnpm install
```

### Run the Development Server

```bash
pnpm dev
```

By default the app boots with MSW-powered mock APIs and is available at http://localhost:5173. API calls are routed to the browser worker so no additional backend services are required while developing features or working on UI.

### Build for Production

```bash
pnpm build
```

The build command runs TypeScript project references and emits an optimized Vite bundle in `dist/`. Preview the production build locally with:

```bash
pnpm preview
```

## Environment Variables

Create a `.env` (or `.env.local`) file in the project root to override defaults:

```bash
VITE_API_URL=https://api.example.com
VITE_USE_MOCKS=true
```

- `VITE_API_URL` controls the HTTP base URL used by the API client. It defaults to `/api`.
- `VITE_USE_MOCKS` toggles the MSW mock layer. Set it to `false` when integrating with a real backend.

Restart the dev server after changing environment values to ensure Vite picks up the new settings.

## Available Scripts

- `pnpm dev` – start the Vite development server with hot module replacement.
- `pnpm build` – type-check and generate the production build.
- `pnpm preview` – preview the production bundle locally.
- `pnpm lint` – run ESLint with the project configuration.
- `pnpm typecheck` – execute TypeScript in build mode without emitting files.

## Project Structure

```text
hack-your-own-app/
├─ public/              # Static assets served by Vite (includes MSW worker)
├─ src/
│  ├─ api/              # Typed API clients, mock defaults, and error helpers
│  ├─ app/              # Application-level providers and router configuration
│  ├─ components/       # Shared UI components (shadcn/ui-based and custom widgets)
│  ├─ features/         # Feature-oriented modules (domains, scans, etc.)
│  ├─ mocks/            # Mock Service Worker handlers and in-memory stores
│  ├─ pages/            # Route-level screens for auth and app workflows
│  ├─ hooks/, lib/, types/  # Supporting utilities and type definitions
│  └─ main.tsx          # Entry point that bootstraps providers and mocks
└─ tailwind.config.ts   # Tailwind CSS configuration
```

## Mock API Layer

During development the app registers MSW request handlers from `src/mocks`. These handlers simulate authentication, domain management, scan scheduling, and profile endpoints. When you are ready to connect to a backend API, disable mocks via `VITE_USE_MOCKS=false` and ensure your API responds to the same routes defined in `src/api`.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `pnpm install`.
3. Run `pnpm lint` and `pnpm typecheck` before submitting pull requests.

## Disclaimer

Hack Your Own Web is intended for educational use only. Always obtain explicit permission before scanning domains you do not own or manage.
