import { NextResponse } from "next/server";
import { mergePullRequest, parseRepoUrl } from "@/lib/github";
import { getRun, updateRun } from "@/lib/run-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
  const { allow } = await request.json() as { allow?: boolean };
  if (!allow) {
    await updateRun(id, { decision: "deny", status: "denied" });
    return NextResponse.json({ status: "denied", message: "Patch denied. The audit branch was retained." });
  }
  if (run.verification?.verdict !== "PROVEN") return NextResponse.json({ error: "Only a proven patch can be applied." }, { status: 409 });
  if (run.mode === "demo") {
    await updateRun(id, { decision: "allow", status: "applied" });
    return NextResponse.json({ status: "applied", message: "Demo patch applied successfully." });
  }
  if (!run.prNumber) return NextResponse.json({ error: "This run has no pull request to merge.", patch: run.diff }, { status: 409 });
  try {
    const result = await mergePullRequest(parseRepoUrl(run.repoUrl), run.prNumber);
    if (!result.merged) throw new Error(result.message);
    await updateRun(id, { decision: "allow", status: "applied" });
    return NextResponse.json({ status: "applied", sha: result.sha, message: "Patch merged after human approval." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Merge failed", patch: run.diff, instructions: "Copy the patch below and apply it with git apply." }, { status: 502 });
  }
}
