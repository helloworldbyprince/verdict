import { CONFIG } from "./config";

export interface TavilyResult { title: string; url: string; content: string; score?: number }

export async function searchTavily(query: string): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) throw new Error("TAVILY_API_KEY is not configured.");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: CONFIG.tavily.searchDepth,
      max_results: CONFIG.tavily.maxResults,
      include_answer: false,
    }),
    signal: AbortSignal.timeout(CONFIG.nebius.requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`Tavily search failed (${response.status}): ${await response.text()}`);
  const data = (await response.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}
