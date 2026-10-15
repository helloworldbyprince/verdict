import type { RunState, RunStep, StepKey } from "./types";

const labels: Record<StepKey, string> = {
  triage: "Triage — finding the failure",
  research: "Researcher — finding the evidence",
  patch: "Patcher — writing the fix",
  verify: "Verifier — running the proof",
};

const globalStore = globalThis as typeof globalThis & { __verdictRuns?: Map<string, RunState> };
export const runs = globalStore.__verdictRuns ??= new Map<string, RunState>();

export function createRun(repoUrl: string, bugDescription: string, mode: "live" | "demo") {
  const id = crypto.randomUUID().split("-")[0];
  const steps = (Object.keys(labels) as StepKey[]).map<RunStep>((key) => ({ key, label: labels[key], status: "waiting", detail: "Queued" }));
  const run: RunState = { id, repoUrl, bugDescription, mode, status: "running", createdAt: Date.now(), steps };
  runs.set(id, run);
  return run;
}

export function getRun(id: string) { return runs.get(id); }

export function updateRun(id: string, patch: Partial<RunState>) {
  const run = runs.get(id);
  if (!run) return;
  Object.assign(run, patch);
}

export function updateStep(id: string, key: StepKey, status: RunStep["status"], detail: string) {
  const run = runs.get(id);
  const step = run?.steps.find((item) => item.key === key);
  if (!step) return;
  step.status = status;
  step.detail = detail;
  if (status === "running") step.startedAt = Date.now();
  if (status === "done" || status === "error") step.completedAt = Date.now();
}
