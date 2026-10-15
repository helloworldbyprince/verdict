import { NextResponse } from "next/server";
import { after } from "next/server";
import { hasLiveCredentials } from "@/lib/config";
import { executeRun } from "@/lib/pipeline";
import { createRun } from "@/lib/run-store";
import { assertRepoAllowed } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json() as { repoUrl?: string; bugDescription?: string; demo?: boolean };
  if (!body.repoUrl || !body.bugDescription) return NextResponse.json({ error: "Repository URL and bug description are required." }, { status: 400 });
  try {
    assertRepoAllowed(body.repoUrl);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repository is not authorized." }, { status: 403 });
  }
  const mode = body.demo || !hasLiveCredentials() ? "demo" : "live";
  const run = createRun(body.repoUrl, body.bugDescription, mode);
  after(() => executeRun(run.id));
  return NextResponse.json({ runId: run.id, mode }, { status: 202 });
}
