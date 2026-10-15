import { askNemotron } from "../nebius";
import type { RepoContext } from "../github";
import type { TriageResult } from "../types";

export async function runTriage(context: RepoContext, bugDescription: string): Promise<TriageResult> {
  const raw = await askNemotron({
    role: "strong", json: true,
    system: "You are VERDICT's triage agent. Return only JSON with suspectedFiles, failingTests, reproductionNotes. Use only paths present in the supplied tree. Never invent paths.",
    prompt: `Bug report:\n${bugDescription}\n\nRepository files:\n${context.tree.join("\n")}`,
  });
  const result = JSON.parse(raw) as TriageResult;
  result.suspectedFiles = (result.suspectedFiles ?? []).filter((file) => context.tree.includes(file));
  if (!result.suspectedFiles.length) throw new Error("Triage did not identify any real repository files.");
  return result;
}
