/**
 * Tiny, swappable LLM client for the "film critic" flourish.
 *
 * Providers (pick via CRITIC_PROVIDER, else auto-detected from which key is set,
 * else the keyless default):
 *   - "pollinations" — keyless, no signup (default; good enough for fun).
 *   - "gemini"       — needs GEMINI_API_KEY  (Google AI Studio, free tier).
 *   - "groq"         — needs GROQ_API_KEY    (Groq, free tier, very fast).
 *
 * Optional CRITIC_MODEL overrides the model for the chosen provider.
 */

type Provider = "pollinations" | "gemini" | "groq";

function pickProvider(): Provider {
  const explicit = process.env.CRITIC_PROVIDER as Provider | undefined;
  if (explicit) return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  return "pollinations";
}

const TIMEOUT_MS = 20_000;

async function withTimeout(input: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

async function pollinations(system: string, user: string): Promise<string> {
  const res = await withTimeout("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.CRITIC_MODEL || "openai",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`pollinations ${res.status}`);
  return (await res.text()).trim();
}

async function gemini(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.CRITIC_MODEL || "gemini-2.5-flash";
  const res = await withTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 500 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const j = await res.json();
  return (j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

async function groq(system: string, user: string): Promise<string> {
  const key = process.env.GROQ_API_KEY!;
  const model = process.env.CRITIC_MODEL || "llama-3.3-70b-versatile";
  const res = await withTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
  );
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const j = await res.json();
  return (j?.choices?.[0]?.message?.content ?? "").trim();
}

/** Sends a system+user prompt to the configured provider and returns the text. */
export async function askAI(system: string, user: string): Promise<string> {
  switch (pickProvider()) {
    case "gemini":
      return gemini(system, user);
    case "groq":
      return groq(system, user);
    default:
      return pollinations(system, user);
  }
}
