import type { VerificationResult, Verdict } from "./types";

export interface VerdictInput {
  timedOut?: boolean;
  checkConclusion?: string | null;
  expectedFailures: string[];
  passingAfter: string[];
  newFailures: string[];
}

export function determineVerdict(input: VerdictInput): Verdict {
  if (input.timedOut || !input.checkConclusion) return "ERROR";
  const allTargetsPass = input.expectedFailures.every((test) =>
    input.passingAfter.includes(test),
  );
  if (
    input.checkConclusion === "success" &&
    allTargetsPass &&
    input.newFailures.length === 0
  ) {
    return "PROVEN";
  }
  return "NOT_PROVEN";
}

export function buildVerification(input: VerdictInput): VerificationResult {
  return {
    verdict: determineVerdict(input),
    before: input.expectedFailures,
    after: input.passingAfter,
    newFailures: input.newFailures,
    conclusion: input.checkConclusion ?? undefined,
    error: input.timedOut ? "GitHub Actions timed out before returning proof." : undefined,
  };
}
