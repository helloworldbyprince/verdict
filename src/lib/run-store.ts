import type { RunState, RunStep, StepKey } from "./types";
import { getCache } from "@vercel/functions";
import { CONFIG } from "./config";

const labels: Record<StepKey, string> = {
  triage: "Triage — finding the failure",
  research: "Researcher — finding the evidence",
  patch: "Patcher — writing the fix",
  verify: "Verifier — running the proof",
};

const globalStore = globalThis as typeof globalThis & { __verdictRuns?: Map<string, RunState> };
const runs = globalStore.__verdictRuns ??= new Map<string, RunState>();
const runtimeCache = getCache({ namespace: "verdict-runs-v1" });
const cacheKey = (id: string) => `run:${id}`;
const useRuntimeCache = Boolean(process.env.VERCEL);

async function persist(run: RunState) {
  runs.set(run.id, run);
  if (useRuntimeCache) await runtimeCache.set(cacheKey(run.id), run, { ttl: CONFIG.pipeline.runStateTtlSeconds, tags: ["verdict-runs"], name: "verdict-run-state" });
}

export async function createRun(repoUrl: string, bugDescription: string, mode: "live" | "demo") {
  const id = crypto.randomUUID().split("-")[0];
  const steps = (Object.keys(labels) as StepKey[]).map<RunStep>((key) => ({ key, label: labels[key], status: "waiting", detail: "Queued" }));
  const run: RunState = { id, repoUrl, bugDescription, mode, status: "running", createdAt: Date.now(), steps };
  await persist(run);
  return run;
}

export async function getRun(id: string) {
  const local = runs.get(id);
  if (local) return local;
  if (!useRuntimeCache) return undefined;
  const cached = await runtimeCache.get(cacheKey(id)) as RunState | undefined;
  if (cached) runs.set(id, cached);
  return cached;
}

export async function updateRun(id: string, patch: Partial<RunState>) {
  const run = await getRun(id);
  if (!run) return;
  Object.assign(run, patch);
  await persist(run);
}

export async function updateStep(id: string, key: StepKey, status: RunStep["status"], detail: string) {
  const run = await getRun(id);
  if (!run) return;
  const step = run.steps.find((item) => item.key === key);
  if (!step) return;
  step.status = status;
  step.detail = detail;
  if (status === "running") step.startedAt = Date.now();
  if (status === "done" || status === "error") step.completedAt = Date.now();
  await persist(run);
}
