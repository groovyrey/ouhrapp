import { buildContext } from "./assistantContext.js";
import { getTool, toolList } from "./tools.js";

export const ASSISTANT_ENDPOINT =
  "https://worker8651.reymartcenteno03.workers.dev/api/groovyrey/gemini";

const STORAGE_KEY = "ouhrapp:assistant:v1";
const HISTORY = 8;
const KEEP = 60;

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

export function describeError(error) {
  const raw = String(error?.message || error || "").trim();
  if (/abort/i.test(raw)) return "the request timed out";
  const status = raw.match(/endpoint (\d{3})/);
  if (status) {
    const code = status[1];
    if (code === "403") return "the server blocked the request (403, origin not allowed)";
    if (code === "429") return "too many requests (429), retry in a minute";
    if (code === "502" || code === "503") return `the model is unavailable (${code})`;
    return `the server returned ${code}`;
  }
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) return "a network or CORS error";
  if (/empty reply/i.test(raw)) return "the model returned an empty reply";
  return raw || "an unknown error";
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

const MAX_ROUNDS = 6;

function historyText() {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-HISTORY)
    .map((m) => `${m.role === "user" ? "Manager" : "Assistant"}: ${m.text}`)
    .join("\n");
}

function toolSystem() {
  return [
    "You are the OUHRAPP manager assistant for a Philippine HR team.",
    "Your purpose is to help the manager make decisions: summarize the situation, compare options, flag risks, and recommend a clear choice with the reason. You advise; the manager decides.",
    "You read live HR data ONLY by calling the tools below. Never invent numbers or people.",
    "Call only the tools you need (at most a few), then answer.",
    "If asked for private data (individual salaries, contacts, government ids), say it is confidential and give an aggregate instead.",
    "Respond ONLY with valid JSON, no markdown and no prose outside the JSON. The answer value itself IS Markdown.",
    'To call a tool reply exactly: {"tool":"<name>","args":{}}',
    'When you have enough data reply: {"answer":"<your decision-focused answer in Markdown, max 120 words: short paragraphs, bullet lists where useful, **bold** for key figures, ending with your recommendation>"}',
    "Available tools:",
    toolList(),
  ].join("\n");
}

async function callModel(system, prompt, signal) {
  const res = await fetch(ASSISTANT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      system,
      temperature: 0.2,
      json: true,
      maxTokens: 2048,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`endpoint ${res.status}`);

  const reader = res.body?.getReader?.();
  let text = "";
  if (reader) {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } else {
    const data = await res.json();
    text = String(data.text ?? "");
  }
  return text.trim();
}

function stripFences(text) {
  return text
    .replace(/```(?:json)?/gi, "")
    .replace(/^\s*json\s*/i, "")
    .trim();
}

function extractJsonObjects(text) {
  const out = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

function collect(item, acc) {
  if (!item || typeof item !== "object") return;
  if (Array.isArray(item)) {
    item.forEach((x) => collect(x, acc));
    return;
  }
  if (typeof item.tool === "string") acc.tools.push({ tool: item.tool, args: item.args || {} });
  if (typeof item.name === "string" && item.args && !item.tool) acc.tools.push({ tool: item.name, args: item.args });
  for (const key of ["tools", "tool_calls", "functionCall", "functionCalls"]) {
    if (Array.isArray(item[key])) collect(item[key], acc);
  }
  if (typeof item.answer === "string" && !acc.answer) acc.answer = item.answer;
}

function parseDecision(raw) {
  const acc = { tools: [], answer: null };
  const text = stripFences(raw || "");
  if (!text) return acc;

  try {
    collect(JSON.parse(text), acc);
    return acc;
  } catch {
    /* fall through to object extraction */
  }

  for (const chunk of extractJsonObjects(text)) {
    try {
      collect(JSON.parse(chunk), acc);
    } catch {
      /* skip malformed chunk */
    }
  }
  return acc;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reveal(text, onToken) {
  if (!onToken) return;
  const step = Math.max(2, Math.ceil(text.length / 80));
  for (let i = step; i < text.length; i += step) {
    onToken(text.slice(0, i));
    await wait(16);
  }
  onToken(text);
  await wait(120);
}

export async function sendMessage(text, { timeout = 90000, onToken } = {}) {
  const clean = String(text ?? "").trim();
  if (!clean) return null;

  messages.push({ role: "user", text: clean, at: new Date().toISOString() });
  persist();
  if (onToken) onToken("");

  const system = toolSystem();
  let transcript = `Conversation so far:\n${historyText()}`;
  let hint = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const paint = () => {
    if (onToken) onToken("");
  };
  const startHint = (text) => {
    hint = { role: "system", text, status: "loading", at: new Date().toISOString() };
    messages.push(hint);
    paint();
  };
  const setHintText = (text) => {
    if (hint) {
      hint.text = text;
      paint();
    }
  };
  const endHint = () => {
    if (hint) {
      hint.status = "done";
      paint();
      hint = null;
    }
  };
  const dropHint = () => {
    if (!hint) return;
    const index = messages.indexOf(hint);
    if (index > -1) messages.splice(index, 1);
    hint = null;
    paint();
  };
  const finishHints = () => {
    if (!hint) return;
    if (hint.text === "Thinking") dropHint();
    else endHint();
  };

  try {
    let answer = null;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      startHint("Thinking");
      const raw = await callModel(system, transcript, controller.signal);
      const decision = parseDecision(raw);

      if (decision.tools.length) {
        const unknown = [];
        let reused = false;

        for (const call of decision.tools) {
          const tool = getTool(call.tool);
          if (!tool) {
            unknown.push(call.tool);
            continue;
          }

          if (!reused && hint) {
            setHintText(tool.label);
            reused = true;
          } else {
            startHint(tool.label);
          }
          await wait(420);

          let result;
          try {
            result = tool.run(call.args || {});
          } catch (error) {
            result = { error: String(error) };
          }
          endHint();
          await wait(120);

          transcript += `\nAssistant tool call: ${JSON.stringify(call)}`;
          transcript += `\nTool result: ${JSON.stringify(result)}`;
        }

        if (!reused) endHint();
        if (unknown.length) {
          transcript += `\nUnknown tool(s): ${unknown.join(", ")}. Use only the listed tools.`;
        }
        continue;
      }

      dropHint();

      if (typeof decision.answer === "string") {
        answer = decision.answer;
        break;
      }

      if (/^[{[]/.test(stripFences(raw))) {
        transcript +=
          '\nYour reply was not usable JSON. Respond with exactly {"tool":"<name>","args":{}} or {"answer":"..."} and nothing else.';
        continue;
      }

      answer = raw;
      break;
    }

    if (!answer) throw new Error("empty reply");
    answer = String(answer).replace(/\s+$/, "");
    if (!answer) throw new Error("empty reply");

    const message = {
      role: "assistant",
      text: answer,
      source: "ai",
      at: new Date().toISOString(),
    };
    await reveal(answer, onToken);
    messages.push(message);
    persist();
    paint();
    return message;
  } catch (error) {
    finishHints();
    const message = {
      role: "assistant",
      text: fallbackDigest(buildContext()),
      source: "fallback",
      error: describeError(error),
      at: new Date().toISOString(),
    };
    messages.push(message);
    persist();
    paint();
    return message;
  } finally {
    clearTimeout(timer);
  }
}
