# Distll V2: Cloudflare Workers Edition

This branch introduces a brand new backend implementation using **Cloudflare Workers** and **Workers AI**, replacing the deprecated Supabase Edge Functions approach.

## Key Improvements in V2

1. **Markdown.new Integration**
   - We completely bypassed `r.jina.ai` as it was a single point of failure and often triggered bot protection or 403s.
   - We now use `https://markdown.new/` which converts any URL reliably into clean, token-efficient markdown to feed to our LLM.

2. **Cloudflare Workers AI Model**
   - Transferred the AI workload completely to the Cloudflare edge.
   - We are using the `@cf/meta/llama-3.1-8b-instruct` model to perform the transformations entirely natively on their network.
   - This prevents API keys leaking and reduces dependencies on OpenRouter while preserving excellent functional quality.

3. **Dynamic Styling Modifiers**
   - The LLM System Prompt now contains a precise state machine (`switch` statement) that intercepts specific styles:
     - `/eli5/` -> Explains the concept simply for a 5-year-old.
     - `/joke/` -> Re-writes the facts as sarcastic comedy.
     - `/simple/`, `/bullets/`, `/tweet/`, `/concise/` are natively configured.
     - `/<Language Context>/` -> Natively translates the generated summary content to the passed modifier (e.g. `tamil`, `spanish`).

4. **Fault Tolerance & Parsing fixes**
   - Upgraded URL Parsing logic so if users accidentally include `localhost:8080` in the URL they typed into their search bar, the worker elegantly cleans it.
   - Both POST (from React UI) and GET (from direct CURLs / Browser usage) routes exist mapped together correctly natively.

## Running It Locally
You need two processes running simultaneously for local development:
1. `npm run dev` inside `distill-v2` runs the backend local Miniflare worker proxy on port `8787` (`npx wrangler dev`).
2. `npm run dev` in the root runs the Vite React UI on port `8080`.

Example Test:
`curl http://localhost:8787/tamil/https://www.bbc.com/sport/articles/cn9e1elzjdzo`
