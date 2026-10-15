import { CONFIG } from "../config";
import { searchTavily } from "../tavily";
import type { Evidence, TriageResult } from "../types";

export async function runResearcher(bugDescription: string, triage: TriageResult): Promise<Evidence[]> {
  const queries = [bugDescription, `${bugDescription} ${triage.reproductionNotes}`].slice(0, CONFIG.tavily.maxSearchesPerRun);
  const results = (await Promise.all(queries.map(searchTavily))).flat();
  const unique = Array.from(new Map(results.map((result) => [result.url, result])).values()).slice(0, CONFIG.tavily.maxResults);
  return unique.map((result) => ({ source: result.title, url: result.url, quote: result.content.slice(0, 320), relevance: `Evidence related to: ${bugDescription}` }));
}
