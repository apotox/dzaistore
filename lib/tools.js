import { API_BASE } from "./config.js";

/** Models offered at launch. Names must match MODELS in api/src/services/billing.ts. */
export const MODELS = [
  { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", note: "default · everyday coding" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", note: "most capable · uses your limit ~4x faster" },
  { id: "glm-5.3", name: "GLM 5.3", note: "alternative · uses your limit ~5x faster" },
  { id: "kimi-k3.1-pro", name: "Kimi K3.1 Pro", note: "uses your limit ~7x faster" },
  { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", note: "coding-tuned · uses your limit ~3x faster" },
];

/**
 * Each supported tool: how to run it, how to run it without a global install,
 * and which environment variables point it at the gateway.
 * Env is only set for the child process — the user's own configs are never touched.
 */
export const TOOLS = {
  claude: {
    label: "Claude Code",
    bin: "claude",
    fallback: ["npx", ["-y", "@anthropic-ai/claude-code"]],
    env: (key) => ({
      ANTHROPIC_BASE_URL: API_BASE,       // Claude Code appends /v1/messages
      ANTHROPIC_AUTH_TOKEN: key,          // sent as Authorization: Bearer
      ANTHROPIC_API_KEY: "",              // avoid conflicts with a personal key
      // Our models fill Claude Code's three slots, so /model lists them instead of Claude models.
      // Names must match MODELS in api/src/services/billing.ts.
      ANTHROPIC_MODEL: "deepseek-v4.1-flash",                  // default for new sessions
      ANTHROPIC_DEFAULT_OPUS_MODEL: "deepseek-v4-pro",
      ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: "DeepSeek V4 Pro",
      ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION: "Most capable · uses your limit about 4x faster",
      ANTHROPIC_DEFAULT_SONNET_MODEL: "glm-5.3",
      ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: "GLM 5.3",
      ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION: "Alternative · uses your limit about 5x faster",
      ANTHROPIC_DEFAULT_HAIKU_MODEL: "deepseek-v4.1-flash",   // also used for background tasks
      ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME: "DeepSeek V4.1 Flash",
      ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION: "Default · everyday coding",
      // Claude Code doesn't know these models, so tell it the context window to work with.
      // The models accept up to 1M tokens; 200k keeps the cost of a single turn bounded.
      CLAUDE_CODE_MAX_CONTEXT_TOKENS: "200000",
    }),
  },

  // Enable them once your gateway exposes /v1/chat/completions.
  opencode: {
    label: "OpenCode",
    bin: "opencode",
    fallback: ["npx", ["-y", "opencode-ai"]],
    env: (key) => ({
      OPENAI_BASE_URL: `${API_BASE}/v1`,
      OPENAI_API_KEY: key,
    }),
  },
};
