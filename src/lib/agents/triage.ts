import { askNemotron } from "../nebius";
import { readFiles, type RepoContext } from "../github";
import { CONFIG } from "../config";
import type { TriageResult } from "../types";

export async function runTriage(context: RepoContext, bugDescription: string): Promise<TriageResult> {
  const contextPaths = context.tree
    .filter((path) => /(^|\/)(package\.json|[^/]*(test|spec)\.[cm]?[jt]sx?)$/i.test(path))
    .slice(0, CONFIG.github.maxTriageContextFiles);
  const files = await readFiles(context, contextPaths, context.headSha);
  const raw = await askNemotron({
    role: "strong", json: true,
    system: "You are VERDICT's triage agent. Return only JSON with suspectedFiles, failingTests, reproductionNotes. Use only paths present in the supplied tree. Never invent paths.",
    prompt: `Bug report:\n${bugDescription}\n\nRepository tree:\n${context.tree.join("\n")}\n\nRelevant package and test files:\n${files.map((file) => `--- ${file.path}\n${file.content.slice(0, CONFIG.github.maxTriageFileChars)}`).join("\n\n")}`,
  });
  const result = JSON.parse(raw) as TriageResult;
  result.suspectedFiles = (result.suspectedFiles ?? []).filter((file) => context.tree.includes(file));
  if (!result.suspectedFiles.length) throw new Error("Triage did not identify any real repository files.");
  return result;
}
