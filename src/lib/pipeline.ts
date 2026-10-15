import { CONFIG } from "./config";
import { runPatcher } from "./agents/patcher";
import { runResearcher } from "./agents/researcher";
import { runTriage } from "./agents/triage";
import { runVerifier } from "./agents/verifier";
import { createPatchPullRequest, getRepoContext } from "./github";
import { getRun, updateRun, updateStep } from "./run-store";
import type { Evidence, TriageResult, VerificationResult } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const demoTriage: TriageResult = {
  suspectedFiles: ["src/cart.js", "test/cart.test.js"],
  failingTests: ["applies discount to every item", "keeps the final quantity in total", "returns discounted subtotal"],
  reproductionNotes: "The discount loop uses qty - 1, skipping the final item in every discounted cart line.",
};

const demoEvidence: Evidence[] = [
  { source: "JavaScript loop boundaries and off-by-one errors", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration", quote: "A loop's terminating condition must account for every intended iteration. Exclusive upper bounds are a frequent source of skipped values.", relevance: "The cart logic stops one item before the actual quantity." },
  { source: "Testing edge cases in quantity calculations", url: "https://jestjs.io/docs/getting-started", quote: "Automated tests can capture expected behavior at boundaries and prevent regressions when implementation details change.", relevance: "The failing tests define the required behavior and become the proof after patching." },
];

const demoDiff = `diff --git a/src/cart.js b/src/cart.js
index b3c92a1..a8d513f 100644
--- a/src/cart.js
+++ b/src/cart.js
@@ -10,7 +10,7 @@ export function calculateTotal(items, discount = 0) {
   return items.reduce((total, item) => {
-    const discountedQty = item.qty - 1;
+    const discountedQty = item.qty;
     const lineTotal = item.price * discountedQty;
     return total + lineTotal * (1 - discount);
   }, 0);`;

async function demoPipeline(id: string) {
  const honestyCase = /missing environment|unfixable|secret|api key/i.test((await getRun(id))?.bugDescription ?? "");
  await updateStep(id, "triage", "running", "Reading the repository tree and test files…"); await wait(CONFIG.ui.demoStepMs);
  await updateRun(id, { triage: demoTriage }); await updateStep(id, "triage", "done", "Found an off-by-one error in src/cart.js");
  await updateStep(id, "research", "running", "Searching upstream documentation and test patterns…"); await wait(CONFIG.ui.demoStepMs);
  await updateRun(id, { evidence: demoEvidence }); await updateStep(id, "research", "done", "Grounded the diagnosis in 2 cited sources");
  await updateStep(id, "patch", "running", "Writing the smallest safe unified diff…"); await wait(CONFIG.ui.demoStepMs);
  await updateRun(id, { diff: demoDiff, branch: `verdict/${id}`, prNumber: 14, prUrl: "https://github.com" }); await updateStep(id, "patch", "done", "Created a 1-line fix on an isolated draft PR");
  await updateStep(id, "verify", "running", "GitHub Actions is executing the full test suite…"); await wait(CONFIG.ui.demoStepMs * 1.4);
  const verification: VerificationResult = honestyCase
    ? { verdict: "NOT_PROVEN", before: demoTriage.failingTests, after: [], newFailures: ["requires PAYMENT_API_KEY"], conclusion: "failure", detailsUrl: "https://github.com" }
    : { verdict: "PROVEN", before: demoTriage.failingTests, after: demoTriage.failingTests, newFailures: [], conclusion: "success", detailsUrl: "https://github.com" };
  await updateRun(id, { verification, status: "complete" });
  await updateStep(id, "verify", "done", honestyCase ? "CI still fails: missing runtime environment variable" : "3 target tests pass · 0 new failures");
}

async function livePipeline(id: string) {
  const run = await getRun(id);
  if (!run) return;
  await updateStep(id, "triage", "running", "Reading the repository tree…");
  const context = await getRepoContext(run.repoUrl);
  const triage = await runTriage(context, run.bugDescription);
  await updateRun(id, { triage }); await updateStep(id, "triage", "done", `Found ${triage.suspectedFiles.length} suspected file${triage.suspectedFiles.length === 1 ? "" : "s"}`);
  await updateStep(id, "research", "running", "Searching for cited upstream evidence…");
  const evidence = await runResearcher(run.bugDescription, triage);
  await updateRun(id, { evidence }); await updateStep(id, "research", "done", `Collected ${evidence.length} cited sources`);
  await updateStep(id, "patch", "running", "Generating and validating a minimal diff…");
  const diff = await runPatcher(context, run.bugDescription, triage, evidence);
  const pr = await createPatchPullRequest(context, id, diff, run.bugDescription.slice(0, 72));
  await updateRun(id, { diff, branch: pr.branch, prNumber: pr.prNumber, prUrl: pr.prUrl }); await updateStep(id, "patch", "done", `Opened draft PR #${pr.prNumber}`);
  await updateStep(id, "verify", "running", "Waiting for deterministic GitHub Actions proof…");
  const verification = await runVerifier(context, pr.sha, pr.branch, context.headSha, triage);
  await updateRun(id, { verification, status: "complete" }); await updateStep(id, "verify", verification.verdict === "ERROR" ? "error" : "done", verification.verdict === "PROVEN" ? "All target tests pass with no new failures" : "CI could not prove the patch");
}

export async function executeRun(id: string) {
  const run = await getRun(id);
  if (!run) return;
  try {
    await Promise.race([
      run.mode === "demo" ? demoPipeline(id) : livePipeline(id),
      new Promise((_, reject) => setTimeout(() => reject(new Error("The pipeline exceeded its hard timeout.")), CONFIG.pipeline.runTimeoutMs)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    const latest = await getRun(id);
    const active = latest?.steps.find((step) => step.status === "running");
    if (active) await updateStep(id, active.key, "error", message);
    await updateRun(id, { status: "error", error: message, verification: { verdict: "ERROR", before: latest?.triage?.failingTests ?? [], after: [], newFailures: [], error: message } });
  }
}
