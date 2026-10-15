import { CONFIG } from "../config";
import { getCheckRuns, triggerTestWorkflow, type RepoRef } from "../github";
import type { TriageResult, VerificationResult } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const failedConclusions = new Set(["failure", "cancelled", "timed_out", "action_required", "stale", "startup_failure"]);

export async function runVerifier(repo: RepoRef, patchSha: string, branch: string, baseRef: string, triage: TriageResult): Promise<VerificationResult> {
  const baseline = await getCheckRuns(repo, baseRef);
  const completedBaseline = baseline.check_runs.filter((check) => check.status === "completed");
  const baselineFailures = completedBaseline.filter((check) => check.conclusion && failedConclusions.has(check.conclusion)).map((check) => check.name);
  const baselineObserved = baselineFailures.length > 0;
  await triggerTestWorkflow(repo, branch);
  const started = Date.now();
  let sawChecks = false;
  while (Date.now() - started < CONFIG.github.pollTimeoutMs) {
    const { check_runs: checks } = await getCheckRuns(repo, patchSha);
    if (checks.length) sawChecks = true;
    if (sawChecks && checks.every((check) => check.status === "completed")) {
      const failed = checks.filter((check) => check.conclusion && failedConclusions.has(check.conclusion));
      const success = failed.length === 0 && baselineObserved;
      const newFailures = failed.map((check) => check.name).filter((name) => !baselineFailures.includes(name));
      return {
        verdict: success ? "PROVEN" : "NOT_PROVEN",
        before: baselineFailures.length ? baselineFailures : triage.failingTests,
        after: success ? (baselineFailures.length ? baselineFailures : triage.failingTests) : [],
        newFailures,
        conclusion: success ? "success" : baselineObserved ? failed.map((check) => check.conclusion).join(", ") : "No failing baseline check was observed on the default branch.",
        detailsUrl: checks[0]?.details_url,
        baselineObserved,
      };
    }
    await delay(CONFIG.github.pollIntervalMs);
  }
  return { verdict: "ERROR", before: baselineFailures.length ? baselineFailures : triage.failingTests, after: [], newFailures: [], baselineObserved, error: "GitHub Actions timed out before returning proof." };
}
