export const CONFIG = {
  nebius: {
    modelStrong: process.env.NEBIUS_MODEL_STRONG,
    modelFast: process.env.NEBIUS_MODEL_FAST,
    maxTokensStrong: 4000,
    maxTokensFast: 1500,
    temperature: 0.2,
    requestTimeoutMs: 60_000,
  },
  tavily: {
    maxSearchesPerRun: 3,
    searchDepth: "basic" as const,
    maxResults: 5,
  },
  github: {
    branchPrefix: "verdict/",
    pollIntervalMs: 15_000,
    pollTimeoutMs: 600_000,
    tokenScopes: ["repo", "workflow"],
    maxTreeFiles: 120,
  },
  pipeline: {
    runTimeoutMs: 900_000,
    maxDiffLines: 200,
  },
  ui: {
    pageSize: 50,
    toastDurationMs: 4000,
    demoStepMs: 1150,
    pollingMs: 1000,
  },
} as const;

export function hasLiveCredentials() {
  return Boolean(
    process.env.NEBIUS_API_KEY &&
      process.env.NEBIUS_BASE_URL &&
      process.env.NEBIUS_MODEL_STRONG &&
      process.env.NEBIUS_MODEL_FAST &&
      process.env.TAVILY_API_KEY &&
      process.env.GITHUB_TOKEN,
  );
}
