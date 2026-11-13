# dzaistore

Use Claude Code with top open-weight models (DeepSeek, GLM, Kimi) on one DZ AI Store subscription, paid with CIB or Edahabia.

```bash
npx dzaistore claude
```

The first time you run it, a browser window opens so you can sign in. After that, Claude Code starts with your subscription. Nothing needs to be installed globally. If Claude Code isn't installed, it runs through `npx` (the first launch may take a minute).

Requires Node.js 18 or newer.

## Commands

| Command | What it does |
|---|---|
| `npx dzaistore claude [args]` | Start Claude Code. Any extra args are passed through to it. |
| `npx dzaistore login` | Sign in through the browser |
| `npx dzaistore login --key sk-…` | Sign in with an API key from your dashboard |
| `npx dzaistore usage` | Show what's left of your 5-hour and 30-day limits |
| `npx dzaistore logout` | Remove the saved key from this computer |

## Models

When Claude Code starts, you're asked which model to use:

| Model | ID | Notes |
|---|---|---|
| DeepSeek V4.1 Flash | `deepseek-v4.1-flash` | Default, for everyday coding |
| DeepSeek V4 Pro | `deepseek-v4-pro` | Most capable; uses your limit ~4x faster |
| GLM 5.3 | `glm-5.3` | Alternative; uses your limit ~5x faster |
| Kimi K3.1 Pro | `kimi-k3.1-pro` | Uses your limit ~7x faster |
| Kimi K2.7 Code | `kimi-k2.7-code` | Tuned for coding; uses your limit ~3x faster |

To skip the question, pass the ID directly:

```bash
npx dzaistore claude --model kimi-k2.7-code
```

You can also set `DZAISTORE_MODEL=kimi-k2.7-code` in your shell profile.

## Usage limits

Your plan gives you a budget for every 5 hours and every 30 days. Bigger models use it faster (see the table above). `npx dzaistore usage` shows how much is left and when each limit resets. When you reach a limit, requests are refused until it resets.

## Privacy and your settings

- Your key is saved in `~/.dzaistore/config.json`, and only your user account can read it. In CI, you can set `DZAISTORE_API_KEY` instead.
- Your own Claude Code settings and Anthropic account are never changed. The DZ AI Store connection applies only to sessions started with `npx dzaistore claude`. Running `claude` on its own works as before.

## Troubleshooting

- **"Your key is invalid or revoked"**: run `npx dzaistore login` again.
- **"Your subscription is not active"**: renew it on the website.
- **Login opens no browser**: copy the link printed in the terminal into a browser and confirm the code shown.

## License

MIT
