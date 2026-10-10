export function decide(evaluation, ai) {
  const flags = ai?.flags ?? [];
  let final;
  let decidedBy;

  if (evaluation.hardFail) {
    final = "Rejected";
    decidedBy = "System (rules)";
  } else if (ai?.decision === "approve" && ai.confidence >= 0.75 && flags.length === 0) {
    final = "Auto-approved";
    decidedBy = "System (AI)";
  } else if (ai?.decision === "reject" && ai.confidence >= 0.75) {
    final = "Rejected";
    decidedBy = "System (AI)";
  } else {
    final = "Needs review";
    decidedBy = "Pending human";
  }

  return {
    final,
    decidedBy,
    decidedAt: new Date().toISOString(),
    rules: evaluation.results,
    ai,
  };
}
