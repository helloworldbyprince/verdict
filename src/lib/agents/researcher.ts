import { CONFIG } from "../config";
import { searchTavily } from "../tavily";
import { askNemotron } from "../nebius";
import type { Evidence, TriageResult } from "../types";

export async function runResearcher(bugDescription: string, triage: TriageResult): Promise<Evidence[]> {
  const planned = await askNemotron({
    role: "fast",
    json: true,
    system: "You are VERDICT's research planner. Return JSON with a queries array containing precise web searches for the reported software failure. Use the exact error, library, runtime, and symptoms when available. No prose.",
    prompt: `Bug report:\n${bugDescription}\n\nTriage:\n${JSON.stringify(triage)}\n\nReturn at most ${CONFIG.pipeline.maxResearchQueries} queries.`,
  });
  const parsed = JSON.parse(planned) as { queries?: unknown[] };
  const queries = (parsed.queries ?? [])
    .filter((query): query is string => typeof query === "string" && query.trim().length > 0)
    .map((query) => query.trim())
    .slice(0, CONFIG.tavily.maxSearchesPerRun);
  if (!queries.length) throw new Error("Researcher did not produce a valid search query.");
  const results = [];
  for (const query of queries) results.push(...await searchTavily(query));
  const unique = Array.from(new Map(results.map((result) => [result.url, result])).values()).slice(0, CONFIG.tavily.maxResults);
  return unique.map((result) => ({ source: result.title, url: result.url, quote: result.content.slice(0, 320), relevance: `Returned for a Nemotron-planned search about: ${bugDescription}` }));
}
