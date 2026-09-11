# Deployment config examples

This folder holds **templates only**. Nothing here is live-deployed yet.

| File | Purpose |
|---|---|
| `render.env.example` | Env vars to paste into Render Web Service |
| `render.yaml.example` | Render Blueprint sketch for future API |
| `netlify.env.example` | Env vars for Netlify (Expo Web) |
| `netlify.toml.example` | Netlify build/publish sketch |
| `local.env.example` | Local `.env` starting point |

## Current status (as of setup)

| Layer | Target | Status |
|---|---|---|
| Frontend | Netlify | **Not connected** — no `netlify.toml` in root, no site linked |
| Backend | Render | **Not connected** — no API service / `server` app yet |
| Database | Supabase | **Ready** — schema + seed applied (`oeourxitofeeeocmajgm`) |

## Recommended fill order

1. Copy Supabase URL + **anon** key into `netlify.env.example` / `local.env.example`.
2. Create Render Web Service later → copy from `render.env.example` (include **service_role** only on Render).
3. Set `EXPO_PUBLIC_API_BASE_URL` on Netlify to the Render URL.
4. Set `CORS_ORIGINS` / `APP_PUBLIC_URL` on Render to the Netlify URL.

## Security

- Never put `SUPABASE_SERVICE_ROLE_KEY` on Netlify or in `EXPO_PUBLIC_*`.
- Prefer Render Dashboard secrets / generateValue over committing `.env`.
