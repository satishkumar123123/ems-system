# React + Vite

## EMS backend connection

All frontend API requests use `src/config/api.js`. Production requests go to
`/api` on the same website. `vercel.json` forwards them to the Render backend at
`https://ems-system-qpv1.onrender.com/api`, before applying the SPA fallback.
Keep `frontend` as the Vercel project's Root Directory. Production deliberately
does not use `VITE_API_BASE_URL`, so an old environment value cannot redirect data
requests to localhost, the frontend itself, or a duplicate `/api` path.

`npm run dev` defaults to `http://localhost:5000`. For local development against
Render, copy `.env.example` to `.env.local`. To move the production backend, change
the external rewrite destination in `vercel.json` and redeploy. See
[Vercel's external rewrite documentation](https://vercel.com/docs/routing/rewrites).

Data requests have a 65-second timeout to allow a sleeping backend to start.
Each page distinguishes connection errors from missing records, offers Retry,
and ignores responses from a previously selected month/year. Save requests are
not retried automatically.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
