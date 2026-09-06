# React + Vite

## EMS backend connection

All frontend API requests use `src/config/api.js`. Production builds default to
`https://ems-system-qpv1.onrender.com`; `npm run dev` defaults to
`http://localhost:5000`.

To override the backend, set `VITE_API_BASE_URL` to its origin (without `/api`).
For local development, copy `.env.example` to `.env.local`. For Vercel, set the
variable in the project's environment settings and redeploy, since Vite reads it
at build time. This is a public API address, never a MongoDB connection string.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
