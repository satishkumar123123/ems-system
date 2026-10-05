# EMS — Energy Management System

**Monthly energy, production and efficiency reporting for ABPL facilities.**

[![Deployment](https://img.shields.io/badge/Frontend-Vercel-black)](https://frontend-nu-five-12.vercel.app/)
![Build](https://img.shields.io/badge/Build-Vite_8-646cff)
![Stack](https://img.shields.io/badge/Stack-React_19_%7C_Express_5_%7C_MongoDB-149eca)
[![ABPL AI Chatbot](https://img.shields.io/badge/ABPL_AI-Chatbot-7c3aed)](#-abpl-ai-chatbot--ems-ai-assistant)

EMS brings energy consumption, fuel inputs, production, equipment performance and improvement follow-up into one application. Electrical and energy-management teams can maintain monthly facility records, compare April–March financial years, review efficiency indicators and prepare reports for management discussions.

- **Frontend deployment:** [frontend-nu-five-12.vercel.app](https://frontend-nu-five-12.vercel.app/)
- **Configured backend:** [ems-system-qpv1.onrender.com](https://ems-system-qpv1.onrender.com/)
- **Repository:** [satishkumar123123/ems-system](https://github.com/satishkumar123123/ems-system)
- **Detailed chatbot configuration:** [backend/CHAT_SETUP.md](backend/CHAT_SETUP.md)

This is a repository containing both applications: `frontend/` is deployed on Vercel, while `backend/` runs as a Node service. Badges describe the configured platform and toolchain; they are not monitored uptime or CI-status badges.


## 🤖 ABPL AI Chatbot — EMS AI Assistant

> **Featured capability:** Ask questions about saved ABPL energy, production, equipment and schedule records, then review calculated tables, visualizations and linked evidence. The assistant supports follow-up questions and optional conversational AI.

**Open the assistant:** ABPL dashboard → top toolbar → chatbot. The page is `/abpl/chat?month=YYYY-MM`; the month parameter supplies the initial period.

[**💬 Open ABPL Chatbot**](https://frontend-nu-five-12.vercel.app/abpl/chat) · [Backend setup and technical notes](backend/CHAT_SETUP.md)

### What you can ask

| Capability | Example question | What the assistant uses |
| --- | --- | --- |
| Plant comparison | “Compare electricity consumption of all plants” | Saved monthly electricity totals for the five ABPL plants |
| Equipment consumption | “Top 10 equipment electricity consumption” | Equipment-month electricity values; the ranking is per equipment-month |
| Production | “Show production for Wider in June 2026” | Saved production values and equipment output units |
| Efficiency | “Show SEC for the selected plant” | Calculated energy/production ratios for compatible tonne-based rows |
| Hindi / Hinglish questions | “June 2026 mein Wider ka electricity consumption kitna tha?” | Supported month, plant and metric wording, with optional AI interpretation |
| Follow-up comparison | After a June electricity answer: “May se kitna badha?” | Previous scope, period totals, absolute change and percentage change |
| Improvement tracking | “Which improvement actions are overdue?” | Saved action records, dates, owners and statuses |
| Meeting review | “Show meeting decisions” | Matching meeting records and saved decision notes |
| Related evidence | After a consumption answer: “Iska reason kya hai?” | Scoped audit findings, meeting notes and action notes; observations are not proof of causation |

Use the **plant, start month, end month and equipment filters** to make the requested scope explicit. **All five plants** includes Wider, Utility, HSU, Narrow Flat and Narrow Tube; **Solar is selected separately**. Explicit supported month/year or financial-year wording can override the date filters.

### Conversation and dashboard experience

- **Context-aware follow-ups:** the page passes the previous answer's scope into the next question. Common metric, period and equipment follow-ups work in Saved-data mode; changing filters resets inherited context.
- **Clarification for ambiguity:** unclear month comparisons or unmatched equipment can produce a clarification instead of an assumed answer.
- **Visible interpretation:** “How your question was understood” shows scope and assumptions, alongside missing-record coverage.
- **Calculated evidence:** expandable tables, chart visualizations and inline source references such as `[S1]` let users inspect the result and open the associated saved record.
- **Report and copy tools:** copy an answer or open a report for printing / saving as PDF. **New chat** clears the current conversation; chat messages are held in page state rather than a persisted chat-history collection.
- **Keyboard support:** Enter sends a question; Shift+Enter inserts a new line. Questions are limited to 1,500 characters.
- **Mode visibility:** the interface labels **Saved-data mode** or **AI + saved records**, with loading, failure and retry feedback.

### Saved-data mode vs. conversational AI

| Mode | Configuration | Behavior |
| --- | --- | --- |
| **Saved-data mode** | No AI credentials required | Deterministic interpretation of supported energy, production, SEC, comparison and schedule questions; returns calculated results, tables and sources |
| **AI + saved records** | Backend `OPENAI_API_KEY` **and** `OPENAI_MODEL` | Optional AI plans supported questions and explains retrieved evidence; the server validates the plan and computes the numbers |
| **Fallback** | AI unavailable, invalid plan or invalid explanation citations | Uses supported deterministic planning / calculated results and discloses the fallback |

**The assistant reads saved database records when a question is submitted.** It is not a continuous monitoring service. It cannot edit records, execute arbitrary model-generated MongoDB queries or answer unsupported questions reliably in Saved-data mode.

### Data sources and answer pipeline

The chat service reads monthly `WiderData`, `UtilityData`, `HsuData`, `NarrowFlatData`, `NarrowTubeData` and `SolarData` documents. Schedule queries and related evidence use `ScheduleItem` objectives, audits, meetings and improvement actions. Its scope is these records; it is not a general search across every collection.

1. Validate the question and filters, resolve supported wording and inherit applicable follow-up scope.
2. If AI is configured, request a structured query plan. Validate allowed plants, metrics, date bounds and comparison periods before retrieval.
3. Read the scoped MongoDB records and calculate totals, SEC, period differences and percentages on the backend.
4. Attach bounded schedule evidence for relevant reason questions, source IDs, missing-record coverage and interpretation assumptions.
5. Optionally generate an AI explanation from the retrieved evidence. Invalid or missing required source references trigger a calculated-result fallback.
6. Return the answer, tables, record links, scope, mode and generation timestamp to the chat page.

The backend uses the OpenAI Responses API through native Fetch with `store: false`. When AI is enabled, selected records and recent conversation turns are sent to the provider. Attachment bytes, environment values and MongoDB credentials are excluded from model context. Source-ID validation checks references; users should still review the tables and supporting records for interpretation accuracy.

### Enable AI on the existing backend

Add these variables to the **Render backend service**, then redeploy:

```dotenv
OPENAI_API_KEY=your_backend_only_api_key
OPENAI_MODEL=your_responses_compatible_model_id
```

Choose a Responses API model available to your OpenAI project and enable API billing. Keep the key in the backend environment; never place it in GitHub, frontend variables or chat messages. No frontend AI key is required.

- `GET /api/chat/status` reports configuration presence, mode and capabilities. **Configured does not mean provider credentials have been verified.**
- `POST /api/chat` accepts a question, plant/date/equipment scope and optional conversation context.
- Each question can make up to two provider calls: planning and explanation, with separate 12-second and 25-second timeouts. Configure provider spending limits separately.

Example request to a locally running backend:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show electricity consumption",
    "plant": "wider",
    "from": "2026-06",
    "to": "2026-06",
    "equipment": "",
    "history": []
  }'
```

Results depend on records actually saved for the requested period; this request does not create sample data. See [Getting Started](#-getting-started-local-setup) and [Environment Variables](#-environment-variables) for the complete application setup.

### Accuracy, coverage and operating limits

- **Missing records are N/A, never zero.** Missing-month coverage is displayed.
- **SEC uses compatible tonne-based production.** Period SEC is a ratio of energy and production sums. Mixed production units prevent meaningful aggregate production rankings.
- **Zero comparison baseline:** percentage change is undefined rather than an invented percentage.
- **Bounded retrieval:** up to 24 months; equipment tables show up to 100 rows. Schedule retrieval uses the latest 200 scoped records and discloses truncation; AI context includes the last five history events per schedule item.
- **Current-work views:** pending, overdue and upcoming questions use current status/date rules; ordinary dated schedule questions use the selected period.
- **Request limits:** 30 chat requests per minute and three concurrent requests **per server instance**, shared across callers. These are not per-user quotas.
- **Access model:** chat follows the application's existing API access model; it does not add user authentication.

Chat regression checks from the repository root:

```bash
node --test backend/test/chat.test.js backend/test/chatUnderstanding.test.js
```

## ✨ Features & Capabilities

### Core logic

- Monthly equipment-level records for **Wider, Utility, HSU, Narrow Flat and Narrow Tube**.
- ABPL aggregation across all five facilities, including record-availability information.
- Electricity, fuel energy, HSD, production, EnPI and percentage contribution calculations.
- Configurable fuel factors, month-aware quantity conversion and persisted formula metadata.
- SEC calculations that use compatible tonne-based production denominators.
- April–March financial-year comparisons for equipment electricity, total energy and production.
- Separate Solar, EV-station electricity and CTL-production records.
- EnPI baseline/target versions effective from a selected month, plus monthly remarks.
- SEU performance registers with baseline, target, monthly values, tolerance, direction and year comparisons.
- Objectives, audits, review meetings and improvement actions with linked records and history.
- **[ABPL AI Chatbot](#-abpl-ai-chatbot--ems-ai-assistant):** read-only questions, follow-up comparisons, calculated evidence and optional conversational AI over saved records.

### Dashboard / UI

- Facility dashboards with consumption, production and EnPI breakdowns.
- Recharts visualizations, expandable charts and equipment comparisons.
- Dedicated equipment detail pages with selected-month values and 6/12-month history.
- EnPI trend windows, target gaps and performance comparisons.
- SEU filters, editable registers, performance summaries and PDF reports.
- Schedule views with status tracking, responsible persons, findings, decisions and verification.
- Equipment QR labels with PNG downloads, printable PDFs and links to equipment pages.
- Spreadsheet upload and sample-template downloads for monthly inputs.
- Management/meeting, SEU and chat reporting utilities.
- Day/night home themes; the theme preference is retained in localStorage.
- Loading/retry notices on data screens and saved-data/AI mode labels on the chatbot.

### Data handling

- Monthly records are stored in MongoDB and upserted by `monthYear`.
- Fuel calculations are shared between backend and frontend utilities.
- September 2026 onward records preserve raw fuel quantities and conversion factors alongside energy values.
- Schedule and SEU updates use revisions to detect concurrent edits.
- EnPI settings have a unique compound key for plant, equipment, unit, kind and effective month.
- Schedule history and attachment metadata accompany the saved record.
- The chat assistant retrieves bounded, plant/date/equipment-scoped records and returns calculated tables and source links.
- Production API calls use same-origin `/api` paths forwarded by Vercel; requests bypass caches.

## 🛠 Tech Stack & Architecture

| Layer | Actual implementation |
| --- | --- |
| Frontend | React `^19.2.8`, React DOM `^19.2.8`, JavaScript/JSX |
| Routing | React Router DOM `^7.18.2` |
| State | React hooks and component-local state |
| Charts / icons | Recharts `^3.10.1`, Lucide React `^1.33.0` |
| Styling | Custom CSS and inline styles; Tailwind/PostCSS/Autoprefixer dependencies and Tailwind directives are present |
| Build | Vite `^8.2.0`, `@vitejs/plugin-react ^6.0.4` |
| Files / reports | SheetJS `xlsx ^0.18.5`, `jspdf ^4.2.1`, `qrcode ^1.5.4` |
| Lint | Oxlint `^1.75.0` with React/Oxc rules |
| Backend | Express `^5.2.1`, CommonJS modules |
| Database | MongoDB with Mongoose `^9.9.3` schema models |
| Backend middleware | CORS, dotenv `^17.4.2`, JSON request parsing |
| Optional AI | Server-side OpenAI Responses API using native Fetch; no OpenAI SDK dependency |
| Tests | Node built-in test runner, assertions, mocked models and selected HTTP route tests |
| Hosting / tooling | Vercel frontend, Render backend, Git/GitHub and npm lockfiles |

The browser calls the Express API. Route modules load Mongoose models, validate supported inputs and save/query MongoDB. Shared utilities compute fuel conversions, financial-year comparisons and schedule rules. Optional AI interprets supported chat questions and explains bounded, calculated evidence; it does not execute model-generated database queries.

There is no separate cache service or checked-in GitHub Actions pipeline. Schema declarations live in `backend/routes/`; there is no standalone `models/` directory.

### Database models

| Model | Purpose |
| --- | --- |
| `WiderData`, `UtilityData`, `HsuData`, `NarrowFlatData`, `NarrowTubeData` | One facility/month document containing equipment rows, totals, input basis and formula |
| `SolarData` | Monthly CTL production, EV-station electricity and solar generation |
| `ScheduleItem` | Objectives, audits, meetings and improvement actions, with attachments/history/revision |
| `SeuRecord` | Saved financial-year SEU overrides, keyed by year and indicator ID |
| `EnpiSetting` | Effective-month target/baseline versions and monthly remarks |

No migration CLI or automatic monthly-data seed command is provided. Reference SEU JSON files are bundled with the frontend and merged with saved overrides; they are separate from monthly energy-input records.

### Calculation rules

- **Fuel cutoff:** `2026-09`. Earlier records retain the legacy energy-input basis.
- **Default factors:** electricity `1`, LNG `13.9`, LPG `12.78`, HSD `3.3`. Fuel inputs are kg and HSD inputs are litres for quantity-basis months; converted energy is stored in kWh.
- **Total energy:** electricity × electricity factor + fuel quantity × selected fuel factor + HSD litres × HSD factor.
- **Energy EnPI:** where the unit is energy per output, total energy is divided by valid positive production; quantity-based kg/output and litre/output indicators use the appropriate raw quantity.
- **SEC:** energy divided by summed compatible tonne-based output. Non-tonne indicators are excluded rather than mixed with tonnes.
- **Missing/zero denominators:** relevant utilities use unavailable values instead of inventing percentages or SEC.
- **SEU:** a separate indicator register; higher/lower-is-better direction controls the deviation sign. Its tolerance is a configured band, not statistical standard deviation.
- **Financial years:** April through March; for example `2026-27` spans April 2026–March 2027.

Custom factors are validated and stored with the monthly record. September-onward spreadsheet imports require quantity headers and reject legacy kWh headers being interpreted as kg/litres.

## 📁 Project Structure

```text
ems-system/
├── README.md                         # Full project setup and architecture
├── package.json                      # Root dependencies; no app scripts/workspaces
├── package-lock.json                 # Root dependency lockfile
├── backend/
│   ├── server.js                     # Express entry, MongoDB connection and route mounting
│   ├── package.json                  # Backend runtime dependencies and start command
│   ├── package-lock.json             # Backend lockfile
│   ├── CHAT_SETUP.md                 # AI setup, retrieval limits and verification notes
│   ├── routes/                       # Mongoose schemas and HTTP endpoints
│   │   ├── abplRoutes.js             # Five-facility aggregation
│   │   ├── widerRoutes.js            # Wider monthly data and YoY comparison
│   │   ├── utilityRoutes.js          # Utility monthly data and YoY comparison
│   │   ├── hsuRoutes.js              # HSU monthly data and YoY comparison
│   │   ├── narrowFlatRoutes.js       # Narrow Flat monthly data and YoY comparison
│   │   ├── narrowTubeRoutes.js       # Narrow Tube monthly data and YoY comparison
│   │   ├── solarRoutes.js            # Solar, EV and CTL records
│   │   ├── scheduleRoutes.js         # Schedule records, updates and attachments
│   │   ├── seuRoutes.js              # SEU overrides and revision validation
│   │   ├── enpiSettingsRoutes.js     # Effective targets and monthly remarks
│   │   └── chatRoutes.js             # Read-only chat and configuration status
│   ├── services/                     # Chat planning, evidence, calculations and AI adapter
│   ├── utils/                        # Fuel conversion, schedule rules and financial years
│   └── test/                         # Backend regression tests
└── frontend/
    ├── index.html                    # Vite HTML entry
    ├── package.json                  # Frontend scripts and dependencies
    ├── package-lock.json             # Frontend lockfile
    ├── .env.example                  # Optional development API origin template
    ├── .oxlintrc.json                # Lint configuration
    ├── vite.config.js                # React plugin configuration
    ├── vercel.json                   # API forwarding, no-cache headers and SPA fallback
    ├── public/                       # Public icons
    ├── src/
    │   ├── main.jsx                  # React root entry
    │   ├── App.jsx                   # Home screen and browser routes
    │   ├── assets/                   # Image and SVG assets
    │   ├── config/api.js             # API origin, timeout and response handling
    │   ├── pages/                    # Facility, YoY, equipment, SEU, schedule and chat pages
    │   ├── components/               # Shared charts, controls, targets and QR interface
    │   ├── styles/                   # Screen and chart styles
    │   └── utils/                    # Calculations, reports, QR catalog and SEU references
    ├── test/                         # Reporting/insight tests
    └── tests/                        # Indicator, spreadsheet and equipment utility tests
```

## 🚀 Getting Started (Local Setup)

### Prerequisites

- **Node.js 22.12.0 or newer** and npm. The locked Vite dependency also supports Node `^20.19.0`; older Node versions are unsupported by this dependency set.
- Git.
- Local MongoDB or an Atlas database reachable from the backend.
- Two terminals for the API and Vite server.

### 1. Clone and install each application

```bash
git clone https://github.com/satishkumar123123/ems-system.git
cd ems-system
npm --prefix backend ci
npm --prefix frontend ci
```

The repository root has no development/start/build scripts and is not an npm workspace. Installing root dependencies alone does not install either application's full dependency set.

### 2. Set backend environment variables

Create `backend/.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/ems_db
PORT=5000
# Optional conversational AI; leave unset for saved-data mode.
OPENAI_API_KEY=
OPENAI_MODEL=
```

There is no committed backend `.env.example`. The URI above is a local dummy example; replace it with your own Atlas URI when using Atlas. Keep credentials out of Git.

### 3. Set frontend development configuration

Copy `frontend/.env.example` to `frontend/.env.local`, then replace its Render example with your local backend origin:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

This is optional: development already defaults to `http://localhost:5000`. Restart Vite after changing the file.

### 4. Start the backend

From the repository root in terminal 1:

```bash
npm --prefix backend start
```

The API defaults to [http://localhost:5000](http://localhost:5000). Confirm the MongoDB connection in the terminal. The root response shows the server is responding; it does not verify database readiness.

### 5. Start the frontend

From the repository root in terminal 2:

```bash
npm --prefix frontend run dev
```

Open the local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173). Select the intended month before entering or importing data. Monthly records are saved through the facility pages.

### 6. Build, lint and preview

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run preview
```

The build output is `frontend/dist/`. Vite preview serves the built UI, but it does **not** apply Vercel's external API rewrite: production assets request `/api` on the preview origin. For functional local data access, use the development server; for a production preview with data, provide an equivalent `/api` proxy or deploy to Vercel.

The backend is plain Node.js and has no build/preview step.

### Regression checks

After installing the application dependencies, run from the repository root:

```bash
node --test backend/test/*.test.js
node --test frontend/tests/*.mjs frontend/test/*.test.js
```

Tests cover fuel conversion, route persistence with mocked models, missing-record handling, financial years, schedules, SEU, chat interpretation/evidence and frontend utility/report calculations. There are no `npm test` scripts; the Node commands are the actual test entry points. These tests do not establish live Atlas, Render or AI-provider availability.

**Documentation verification:** all 66 existing tests passed, frontend lint completed with existing warnings, and the production build succeeded. The build still reports unprocessed legacy `@tailwind` directives and a large main chunk; these are existing implementation warnings, not resolved by this documentation change.

## ⚙️ Environment Variables

| Variable | Application | Required | Purpose | Dummy example |
| --- | --- | --- | --- | --- |
| `MONGODB_URI` | Backend | For your hosted database; local default exists | MongoDB connection URI; defaults to local `ems_db` when absent | `mongodb://127.0.0.1:27017/ems_db` |
| `PORT` | Backend | Optional | API listening port; defaults to 5000 | `5000` |
| `OPENAI_API_KEY` | Backend | Optional; required for AI mode | Server-only provider credential | `your-server-api-key` |
| `OPENAI_MODEL` | Backend | Required for AI mode | Responses-compatible model ID available in your API project | `your-enabled-model-id` |
| `VITE_API_BASE_URL` | Frontend | Optional, development only | API origin used by Vite development; default localhost:5000 | `http://localhost:5000` |

Production frontend requests intentionally ignore `VITE_API_BASE_URL`. They stay on the website origin and use `frontend/vercel.json`. Vite variables are browser-visible; never put MongoDB or AI credentials in them.

## 🌐 Deployment Notes (Vercel)

### Frontend

1. Import the repository into Vercel and set **Root Directory** to `frontend`.
2. Select the **Vite** preset.
3. Use install command `npm ci`, build command `npm run build`, and output directory `dist`.
4. Select a Node runtime compatible with the prerequisites above.
5. The committed `vercel.json` first forwards `/api/:path*` to `https://ems-system-qpv1.onrender.com/api/:path*`, then falls back to `/index.html` for client-side routes.
6. API rewrite responses receive no-store headers. Moving the production API requires editing this destination and redeploying; changing a frontend environment variable does not redirect production data calls.
7. Verify a nested route and an API request after deployment.

### Backend

Deploy `backend/` as a Render Node service, install with `npm ci`, and start with `npm start`. Configure `MONGODB_URI` in Render and allow the service to reach MongoDB. The server honors the hosting platform's `PORT`.

For conversational AI, configure `OPENAI_API_KEY` and `OPENAI_MODEL` on **Render only**, then redeploy. Without both values, the existing chat page remains available in saved-data mode. See [CHAT_SETUP.md](backend/CHAT_SETUP.md) for filters, follow-ups, provider fallback and limits.

The shared API helper allows up to 65 seconds for backend startup, rejects HTML responses being mistaken for JSON, and exposes retryable errors. No CI/CD workflow is checked into GitHub; Git-triggered deployments depend on the hosting projects' settings.

### Browser routes

| Area | Paths |
| --- | --- |
| Home / corporate | `/`, `/abpl` |
| Facility dashboards | `/wider`, `/utility`, `/hsu`, `/narrow-flat`, `/narrow-tube` |
| Facility comparisons | Each facility path plus `/yoy` |
| Solar | `/solar`, `/solar/yoy` |
| Equipment details | `/equipment/:plant?equipment=NAME&month=YYYY-MM` |
| SEU | `/:plant/seu` |
| Schedules | `/:plant/schedule` |
| Chat | `/abpl/chat?month=YYYY-MM` |
| Generic placeholder | `/details/:id` |

Schedule/EnPI plant IDs are exactly `wider`, `utility`, `hsu`, `narrow-flat` and `narrow-tube`. Chat also supports Solar; ABPL SEU navigation provides the aggregate register.

### API reference

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Server response |
| GET | `/api/energy-policy` | Fuel cutoff, version and default factors |
| GET | `/api/abpl?month=YYYY-MM` | Five-facility aggregation and availability |
| GET | `/api/{facility}?month=YYYY-MM` | Facility monthly record, or null when absent |
| POST | `/api/{facility}/save` | Upsert month, equipment rows, totals and formula |
| GET | `/api/{facility}/yoy?year=2026-27` | Current/previous financial-year equipment comparison |
| GET | `/api/solar?month=YYYY-MM` | Solar/CTL/EV monthly record |
| POST | `/api/solar/save` | Save solarElectricity, ctlProduction and evStationElectricity |
| GET | `/api/solar/yoy?year=2025-26` | Solar financial-year comparison |
| GET | `/api/schedule/:plant` | Plant schedule records |
| POST | `/api/schedule/:plant/items` | Create objective, audit, meeting or action |
| PATCH | `/api/schedule/:plant/items/:id` | Update with revision and append history |
| GET | `/api/schedule/:plant/items/:id/files/:fileId` | Download an attachment |
| GET | `/api/seu/:year` | Saved SEU overrides for financial-year start |
| PUT | `/api/seu/:year/:id` | Save SEU override with revision |
| GET | `/api/enpi-settings/:plant` | Settings for equipment/unit query parameters |
| POST | `/api/enpi-settings/:plant/targets` | Create effective-month baseline/target |
| PUT | `/api/enpi-settings/:plant/remarks` | Upsert monthly remark |
| GET | `/api/chat/status` | AI configuration presence and capabilities |
| POST | `/api/chat` | Read-only saved-data/AI question |

`{facility}` means the five explicit facility IDs above, not a catch-all API route. Schemas and request validation live in the route modules.

### Data provenance and current limits

- ABPL and chat calculations distinguish absent records from recorded zeros. Facility YoY helpers currently convert missing/invalid equipment fields to zero.
- **Solar YoY currently generates random sample values for missing monthly records.** Treat those fallback points as sample data, not measured or audited readings.
- SEU reference registers include supplied figures and are labelled separately from saved overrides. They are not automatically synchronized with monthly energy input.
- The chatbot is read-only and reads selected records per request; it is not a continuous equipment monitor. Its source-ID checks validate citation IDs, not every semantic claim.
- Chat retrieval is bounded: up to 24 months, capped schedule/equipment evidence and explicit limitation notices. Optional AI sends selected evidence to the provider.
- Schedule attachments are stored in MongoDB as base64, up to three files of 1 MB each. Ordinary schedule lists omit the binary payload.
- CORS is currently unrestricted. Authentication/role-based access is not implemented; editor/reviewer names in forms are supplied text.
- These features do not establish certification to an energy-management standard.

## 🤝 Contributing & License

1. Fork the repository and clone your fork.
2. Create a branch: `git switch -c feature/your-change`.
3. Keep frontend/backend calculation behavior and API payloads aligned.
4. Run the relevant Node regression tests, frontend lint and production build.
5. Check the affected month/year, missing-data, zero-denominator and save-conflict states.
6. Commit, push your branch and open a pull request explaining the behavior and validation.

**License:** `backend/package.json` declares **ISC**. The root and frontend packages do not specify a project-wide license, and there is no root `LICENSE` file. Embedded report-font licensing is recorded separately in [frontend/src/utils/FONT-LICENSE.txt](frontend/src/utils/FONT-LICENSE.txt). Do not assume the backend declaration grants a license for the entire repository.
