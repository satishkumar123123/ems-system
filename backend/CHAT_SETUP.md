# EMS chatbot

The ABPL top toolbar opens `/abpl/chat?month=YYYY-MM`. The chat page offers plant, start/end month and equipment filters. `/api/chat` reads existing MongoDB monthly and schedule records. It cannot change records and never submits model-generated database queries.

## Enable conversational AI on Render

Add these environment variables to the existing backend Render service, then redeploy:

- `OPENAI_API_KEY`: your own OpenAI API key with available API billing.
- `OPENAI_MODEL`: an API model ID enabled for your OpenAI project and supporting the Responses API.

Keep these only in Render's backend environment. Do not add the key to GitHub, frontend variables or chat messages. The app never asks visitors to enter a key.

Without both variables the chatbot remains usable in **Saved-data mode** for explicit monthly energy/production/SEC questions, plant comparisons, equipment tables and schedule searches. The UI labels this mode and does not pretend it is a general conversational model. `/api/chat/status` reports configuration presence, not whether the provider credentials have been verified.

The optional integration calls the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) with `store:false`. Selected plant records and recent chat turns are sent to that provider only when enabled. No attachment bytes, environment values or MongoDB credentials enter model context. API usage is billed by the provider. Provider failures fall back to calculated results.

## Scope and limits

- Five production/utility plants; Solar can be selected separately.
- Selected range up to 24 months; explicit English month/year or financial-year wording overrides date filters. For ambiguous questions, use filters.
- Follow-up questions retain the previous answer's scope in the UI. In data mode, common follow-ups retain metric and equipment. For example, after June CGL electricity ask "May se kitna badha?". Explicitly changing filters resets inherited context. Arbitrary natural-language understanding requires AI configuration.
- Missing monthly records are N/A, not zero. SEC uses only tonne-based rows; plant totals may contain mixed production units.
- Latest 200 schedule records after plant/date/category filtering, with an explicit truncation message; last five history events per item for AI context. Current pending/overdue/upcoming views are distinct from selected-date views.
- Equipment table capped at 100 rows; all source links for the bounded retrieval remain available. AI explanations receive only the displayed scope, not the entire database.
- A server instance allows 30 chat requests/minute and three concurrent requests. Set provider spending limits separately.
- Chat is read-only but follows the existing application's access model. This change does not introduce user authentication.

## Verification

`node --test backend/test/chat.test.js`

Production validation can use read-only POST questions; no records are created by the chat endpoint.

## Version 2: understanding and evidence

- Deterministic follow-ups, Hindi month/metric aliases and previous financial-year resolution.
- Ambiguous month comparisons ask a clarification before reading data.
- Backend computes period deltas and percentages; zero baseline gives an undefined percentage, missing records give N/A. SEC periods use a ratio of energy/production sums.
- Why/reason questions search matching plant/date/equipment audit, meeting and action notes. Notes are related observations, not proof of causation. Evidence search failures are disclosed.
- Stable source IDs link inline citations to records; the UI shows missing-month coverage and interpretation assumptions.
- With AI configured, a strict JSON query planner runs before retrieval. Server validation enforces allowed plants, supported metrics, date bounds and equal comparison lengths. There is no arbitrary query execution. Invalid or unavailable AI falls back to deterministic planning.
- AI explanation must reference supplied source IDs or it falls back to the calculated result. This checks reference validity, not semantic accuracy of every model claim; review the attached data tables.
- Up to two provider calls per question (planning and explanation), with separate 12s/25s timeouts. API billing must be enabled on the configured provider project.

Additional regression tests: `node --test backend/test/chatUnderstanding.test.js`.
