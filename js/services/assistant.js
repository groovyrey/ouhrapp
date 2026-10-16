import { buildContext } from "./assistantContext.js";

export const ASSISTANT_ENDPOINT =
  "https://worker8651.reymartcenteno03.workers.dev/api/groovyrey/gemini";

const STORAGE_KEY = "ouhrapp:assistant:v1";
const HISTORY = 8;
const KEEP = 60;

const SYSTEM = [
  "You are the OUHRAPP manager assistant for a Philippine HR team.",
  "Help the manager decide: summarize, compare, flag risks, and recommend options across people, hiring, onboarding, attendance, leave, payroll, performance, compensation, compliance, and reports.",
  "Use only the HR data snapshot in the prompt. Never invent numbers or people. If something is not in the snapshot, say it is not available.",
  "The snapshot already excludes private data: individual salaries, contact details, government ids, and confidential case narratives.",
  "If asked for private data, say it is confidential and offer a non-private or aggregate angle instead.",
  "Be concise: at most 120 words, plain text, no markdown, short lines.",
  "You advise; the manager decides. Give a clear recommendation and the reason.",
].join(" ");

let messages = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("ouhrapp: failed to read assistant history", error);
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-KEEP)));
  } catch (error) {
    console.warn("ouhrapp: failed to save assistant history", error);
  }
}

export function getMessages() {
  return messages;
}

export function clearMessages() {
  messages = [];
  persist();
}

export function buildPrompt(context) {
  const history = messages
    .slice(-HISTORY)
    .map((m) => `${m.role === "user" ? "Manager" : "Assistant"}: ${m.text}`)
    .join("\n");

  return [
    "HR data snapshot (private fields already removed):",
    JSON.stringify(context),
    "",
    "Conversation so far:",
    history,
    "",
    "Reply as the assistant to the manager's latest message.",
  ].join("\n");
}

export function fallbackDigest(context) {
  const outstanding = context.compliance.policies.reduce((sum, p) => sum + p.outstanding, 0);
  const wantReminder =
    context.compliance.policies
      .filter((p) => p.outstanding > 0)
      .map((p) => p.name)
      .join(", ") || "none";
  return [
    "The assistant is offline right now, so here is a snapshot while you retry.",
    `${context.headcount.total} people, ${context.headcount.active} active.`,
    `${context.leave.pending} leave request(s) waiting on you.`,
    `${outstanding} policy acknowledgment(s) outstanding (${wantReminder}).`,
    `${context.relations.total} relation case(s) on file.`,
    `Hiring: ${context.recruitment.byStage.Offer ?? 0} at offer, ${context.recruitment.byStage.Hired ?? 0} hired.`,
  ].join("\n");
}

export async function sendMessage(text, { timeout = 90000, onToken } = {}) {
  const clean = String(text ?? "").trim();
  if (!clean) return null;

  messages.push({ role: "user", text: clean, at: new Date().toISOString() });
  persist();

  const context = buildContext();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: buildPrompt(context),
        system: SYSTEM,
        temperature: 0.2,
        json: false,
        maxTokens: 2048,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`endpoint ${response.status}`);

    let reply = "";
    let model = response.headers?.get?.("X-Model") || null;
    const reader = response.body?.getReader?.();

    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        if (onToken) onToken(reply);
      }
      reply += decoder.decode();
    } else {
      const data = await response.json();
      reply = String(data.text ?? "");
      model = data.model || model;
    }

    reply = reply.replace(/\s+$/, "");
    if (!reply) throw new Error("empty reply");

    const message = {
      role: "assistant",
      text: reply,
      source: "ai",
      model,
      at: new Date().toISOString(),
    };
    messages.push(message);
    persist();
    if (onToken) onToken("");
    return message;
  } catch (error) {
    const message = {
      role: "assistant",
      text: fallbackDigest(context),
      source: "fallback",
      error: String(error?.message || error),
      at: new Date().toISOString(),
    };
    messages.push(message);
    persist();
    if (onToken) onToken("");
    return message;
  } finally {
    clearTimeout(timer);
  }
}
