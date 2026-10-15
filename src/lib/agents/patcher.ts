import { CONFIG } from "../config";
import { readFile, type RepoContext } from "../github";
import { askNemotron } from "../nebius";
import type { Evidence, TriageResult } from "../types";

export async function runPatcher(context: RepoContext, bugDescription: string, triage: TriageResult, evidence: Evidence[]) {
  const files = await Promise.all(triage.suspectedFiles.map(async (path) => ({ path, content: await readFile(context, path, context.headSha) })));
  let diff = await askNemotron({
    role: "strong",
    system: "You are VERDICT's patcher. Return ONLY a valid git unified diff. Make the smallest safe fix. Do not use markdown fences or prose. Only edit supplied suspected files and preserve style.",
    prompt: `Bug:\n${bugDescription}\n\nTriage:\n${JSON.stringify(triage)}\n\nEvidence:\n${JSON.stringify(evidence)}\n\nFiles:\n${files.map((file) => `--- ${file.path}\n${file.content}`).join("\n\n")}`,
  });
  diff = diff.replace(/^```(?:diff)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (diff.split("\n").length > CONFIG.pipeline.maxDiffLines) throw new Error(`Patch exceeds the ${CONFIG.pipeline.maxDiffLines}-line safety limit.`);
  return diff;
}
