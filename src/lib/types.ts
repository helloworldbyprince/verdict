export type Verdict = "PROVEN" | "NOT_PROVEN" | "ERROR";
export type StepKey = "triage" | "research" | "patch" | "verify";
export type StepStatus = "waiting" | "running" | "done" | "error";

export interface Evidence {
  source: string;
  url: string;
  quote: string;
  relevance: string;
}

export interface TriageResult {
  suspectedFiles: string[];
  failingTests: string[];
  reproductionNotes: string;
}

export interface VerificationResult {
  verdict: Verdict;
  before: string[];
  after: string[];
  newFailures: string[];
  conclusion?: string;
  detailsUrl?: string;
  error?: string;
}

export interface RunStep {
  key: StepKey;
  label: string;
  status: StepStatus;
  detail: string;
  startedAt?: number;
  completedAt?: number;
}

export interface RunState {
  id: string;
  repoUrl: string;
  bugDescription: string;
  mode: "live" | "demo";
  status: "running" | "complete" | "error" | "applied" | "denied";
  createdAt: number;
  steps: RunStep[];
  triage?: TriageResult;
  evidence?: Evidence[];
  diff?: string;
  branch?: string;
  prUrl?: string;
  prNumber?: number;
  verification?: VerificationResult;
  error?: string;
  decision?: "allow" | "deny";
}
