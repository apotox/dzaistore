# dzaistore CLI

```bash
npx dzaistore claude
```

First run opens the browser to sign in. After that it starts Claude Code connected to the DZ AI Store gateway, using your subscription's 5-hour and 30-day limits.

| Command | What it does |
|---|---|
| `npx dzaistore claude [args]` | Start Claude Code (args are passed through) |
| `npx dzaistore login` | Sign in through the browser |
| `npx dzaistore login --key sk-…` | Sign in with a key from the dashboard |
| `npx dzaistore usage` | Show remaining 5h / 30-day usage |
| `npx dzaistore logout` | Remove the saved key |

`dzaistore claude` asks which model to use at launch. Pass `--model <id>` or set `DZAISTORE_MODEL` to skip the question.

The key is saved in `~/.dzaistore/config.json`. Your own Claude Code settings are never changed; the gateway settings apply only to sessions started with `dzaistore`.

## Backend endpoints the CLI expects

| Endpoint | Response |
|---|---|
| `POST /cli/device` | `{ device_code, user_code, verification_url, interval, expires_in }` |
| `POST /cli/token` `{ device_code }` | `428` while pending; `410` when expired; `200 { api_key, email }` when approved (handed out once) |
| `GET /v1/usage` (Bearer key) | `{ plan, window: { used_pct, credits_left, resets_at }, month: { used_pct, credits_left, resets_at } }`; `401` bad key, `402` no active subscription |
| `POST /v1/messages` | Anthropic Messages API (streaming + tool use), served by the gateway in `../api`; `429` when a 5h or 30-day limit is reached |

Testing locally: `DZAISTORE_API=http://localhost:4000 node bin/dzaistore.js claude`

## Publishing

```bash
npm login
npm publish
```
