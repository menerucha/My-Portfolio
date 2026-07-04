# Rucha's Portfolio

A React + Vite site, ready to deploy on Vercel.

## Deploy to Vercel

1. Push this folder to a new GitHub repo (or use the Vercel CLI to deploy the folder directly — see below).
2. Go to https://vercel.com/new and import the repo.
3. Vercel will auto-detect Vite — no config changes needed.
4. **Important — for the AI chat assistant to work:** in your Vercel project, go to
   **Settings → Environment Variables** and add one of these:
   - `GEMINI_API_KEY` = your Google Gemini API key
   - `GOOGLE_API_TOKEN` = a valid OAuth bearer token / service account access token

   Then make sure the Google Cloud project has the **Generative AI API** enabled.

   Without valid credentials, the chat assistant will show an authentication error.
5. Deploy. You'll get a live URL like `rucha-portfolio.vercel.app` you can put on LinkedIn.

## Deploy without GitHub (CLI)

```bash
npm install -g vercel
cd rucha-portfolio
vercel
```
Follow the prompts, then add the `GEMINI_API_KEY` env variable as above (either in
the dashboard, or via `vercel env add GEMINI_API_KEY`), then run `vercel --prod`.

## Local development

```bash
npm install
npm run dev
```
Note: the chat feature calls `/api/chat`, which only works when deployed on Vercel
(or run locally with `vercel dev`) since it's a serverless function.
