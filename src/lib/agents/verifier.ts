import { CONFIG } from "../config";
import { getCheckRuns, type RepoRef } from "../github";
import type { TriageResult, VerificationResult } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runVerifier(repo: RepoRef, ref: string, triage: TriageResult): Promise<VerificationResult> {
  const started = Date.now();
  let sawChecks = false;
  while (Date.now() - started < CONFIG.github.pollTimeoutMs) {
    const { check_runs: checks } = await getCheckRuns(repo, ref);
    if (checks.length) sawChecks = true;
    if (sawChecks && checks.every((check) => check.status === "completed")) {
      const failed = checks.filter((check) => check.conclusion !== "success");
      const success = failed.length === 0;
      return {
        verdict: success ? "PROVEN" : "NOT_PROVEN",
        before: triage.failingTests,
        after: success ? triage.failingTests : [],
        newFailures: failed.map((check) => check.name),
        conclusion: success ? "success" : failed.map((check) => check.conclusion).join(", "),
        detailsUrl: checks[0]?.details_url,
      };
    }
    await delay(CONFIG.github.pollIntervalMs);
  }
  return { verdict: "ERROR", before: triage.failingTests, after: [], newFailures: [], error: "GitHub Actions timed out before returning proof." };
}
