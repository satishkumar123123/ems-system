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
- Follow-up questions retain the previous answer's scope in the UI. In data mode, restate the metric or use a suggestion; arbitrary natural-language understanding requires AI configuration.
- Missing monthly records are N/A, not zero. SEC uses only tonne-based rows; plant totals may contain mixed production units.
- Latest 200 schedule records per requested scope, with an explicit truncation message; last five history events per item for AI context. Current pending/overdue/upcoming views are distinct from selected-date views.
- Equipment table capped at 100 rows; source links capped at 40. AI explanations receive only the displayed scope, not the entire database.
- A server instance allows 30 chat requests/minute and three concurrent requests. Set provider spending limits separately.
- Chat is read-only but follows the existing application's access model. This change does not introduce user authentication.

## Verification

`node --test backend/test/chat.test.js`

Production validation can use read-only POST questions; no records are created by the chat endpoint.
