export const GEMINI_ENDPOINT =
  "https://worker8651.reymartcenteno03.workers.dev/api/groovyrey/gemini";

const SYSTEM = [
  "You are an HR leave reviewer for a Philippine company.",
  "Decide the leave request using the rule results, coverage, and policy provided.",
  "Return ONLY a JSON object with keys: decision (one of approve, reject, review),",
  "confidence (number from 0 to 1), rationale (one or two plain sentences citing the policy or rule),",
  "and flags (array of short strings, empty when none).",
  "Never approve when a rule has failed. No markdown, no extra text.",
].join(" ");

export function buildPrompt(request, type, evaluation) {
  const rules = evaluation.results.map((r) => `${r.label}: ${r.status} (${r.detail})`).join("\n");
  const policy = [
    `Type: ${type?.name ?? request.typeId}, paid: ${type?.paid ? "yes" : "no"}`,
    `Minimum notice: ${type?.noticeDays ?? 0} day(s)`,
    type?.requiresDoc ? "Document required beyond 2 days" : "No document required",
    `Max teammates off at once in a team: ${type?.maxConcurrent ?? 2}`,
    "Balance and blackout limits are enforced by the rules engine",
  ].join("\n");

  return [
    "Leave request",
    `Employee: ${request.employeeName}`,
    `Type: ${type?.name ?? request.typeId}`,
    `Dates: ${request.startDate} to ${request.endDate} (${evaluation.days} day(s))`,
    `Reason: ${request.reason || "not provided"}`,
    `Balance remaining: ${evaluation.remaining} day(s)`,
    "",
    "Rule results",
    rules,
    "",
    "Policy",
    policy,
    "",
    "Return the JSON decision now.",
  ].join("\n");
}

function parseJson(text) {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalize(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const decision = ["approve", "reject", "review"].includes(parsed.decision)
    ? parsed.decision
    : "review";
  const confidence =
    typeof parsed.confidence === "number"
      ? Math.min(Math.max(parsed.confidence, 0), 1)
      : 0.5;
  const rationale = typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 400) : "";
  const flags = Array.isArray(parsed.flags)
    ? parsed.flags.filter((f) => typeof f === "string").slice(0, 5)
    : [];
  return { decision, confidence, rationale, flags };
}

function fallback(evaluation) {
  const decision = evaluation.hardFail ? "reject" : evaluation.flags.length ? "review" : "approve";
  const confidence = evaluation.hardFail ? 0.9 : evaluation.flags.length ? 0.5 : 0.7;
  const rationale = evaluation.hardFail
    ? "A required rule failed, so the request cannot proceed as submitted."
    : evaluation.flags.length
      ? "Rules passed but flags were raised, so a human should review."
      : "All rules passed and the request looks routine.";
  return {
    decision,
    confidence,
    rationale,
    flags: evaluation.flags.map((f) => f.detail),
    source: "fallback",
    model: null,
  };
}

export async function requestEvaluation(request, type, evaluation, { timeout = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: buildPrompt(request, type, evaluation),
        system: SYSTEM,
        temperature: 0,
        json: true,
        maxTokens: 400,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`endpoint ${response.status}`);
    const data = await response.json();
    const parsed = normalize(parseJson(data.text));
    if (!parsed) throw new Error("unparseable response");
    return { ...parsed, source: "ai", model: data.model || null };
  } catch (error) {
    return { ...fallback(evaluation), error: String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}
