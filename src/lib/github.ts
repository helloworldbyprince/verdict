import { CONFIG } from "./config";

export interface RepoRef { owner: string; repo: string }
export interface RepoContext extends RepoRef { defaultBranch: string; headSha: string; tree: string[] }

function headers() {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured.");
  return {
    authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "content-type": "application/json",
  };
}

async function github<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${path}: ${await response.text()}`);
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function parseRepoUrl(url: string): RepoRef {
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") throw new Error("Use a github.com repository URL.");
  const [owner, rawRepo] = parsed.pathname.split("/").filter(Boolean);
  const repo = rawRepo?.replace(/\.git$/, "");
  if (!owner || !repo) throw new Error("The GitHub URL must include an owner and repository.");
  return { owner, repo };
}

export function assertRepoAllowed(repoUrl: string) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const slug = `${owner}/${repo}`.toLowerCase();
  if (!CONFIG.github.allowedRepos.length) {
    throw new Error("No GitHub repositories are allowlisted. Configure GITHUB_ALLOWED_REPOS before enabling live runs.");
  }
  if (!CONFIG.github.allowedRepos.includes(slug)) {
    throw new Error(`Repository ${slug} is not authorized for VERDICT runs.`);
  }
  return { owner, repo };
}

export async function getRepoContext(repoUrl: string): Promise<RepoContext> {
  const { owner, repo } = assertRepoAllowed(repoUrl);
  const meta = await github<{ default_branch: string }>(`/repos/${owner}/${repo}`);
  const branch = await github<{ commit: { sha: string } }>(`/repos/${owner}/${repo}/branches/${encodeURIComponent(meta.default_branch)}`);
  const tree = await github<{ tree: { path: string; type: string }[] }>(`/repos/${owner}/${repo}/git/trees/${branch.commit.sha}?recursive=1`);
  return {
    owner, repo, defaultBranch: meta.default_branch, headSha: branch.commit.sha,
    tree: tree.tree.filter((item) => item.type === "blob").slice(0, CONFIG.github.maxTreeFiles).map((item) => item.path),
  };
}

export async function readFile(repo: RepoRef, path: string, ref: string) {
  const data = await github<{ content: string; encoding: string }>(`/repos/${repo.owner}/${repo.repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}?ref=${encodeURIComponent(ref)}`);
  if (data.encoding !== "base64") throw new Error(`Unsupported encoding for ${path}.`);
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}

export async function readFiles(repo: RepoRef, paths: string[], ref: string) {
  return Promise.all(paths.map(async (path) => ({ path, content: await readFile(repo, path, ref) })));
}

interface FilePatch { path: string; hunks: { oldStart: number; lines: string[] }[] }

export function parseUnifiedDiff(diff: string): FilePatch[] {
  const files: FilePatch[] = [];
  let current: FilePatch | undefined;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).trim().replace(/^b\//, "");
      current = { path, hunks: [] };
      files.push(current);
    } else if (line.startsWith("@@") && current) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/);
      if (!match) throw new Error(`Invalid hunk header: ${line}`);
      current.hunks.push({ oldStart: Number(match[1]), lines: [] });
    } else if (current?.hunks.length && (/^[ +\-]/.test(line) || line === "\\ No newline at end of file")) {
      current.hunks.at(-1)!.lines.push(line);
    }
  }
  if (!files.length) throw new Error("The model did not return a valid unified diff.");
  return files;
}

export function getDiffPaths(diff: string) {
  return parseUnifiedDiff(diff).map((patch) => patch.path);
}

function applyPatch(source: string, patch: FilePatch) {
  const original = source.split("\n");
  let offset = 0;
  for (const hunk of patch.hunks) {
    let index = hunk.oldStart - 1 + offset;
    for (const line of hunk.lines) {
      const kind = line[0];
      const value = line.slice(1);
      if (line.startsWith("\\")) continue;
      if (kind === " ") {
        if (original[index] !== value) throw new Error(`Patch context mismatch in ${patch.path}.`);
        index += 1;
      } else if (kind === "-") {
        if (original[index] !== value) throw new Error(`Patch removal mismatch in ${patch.path}.`);
        original.splice(index, 1); offset -= 1;
      } else if (kind === "+") {
        original.splice(index, 0, value); index += 1; offset += 1;
      }
    }
  }
  return original.join("\n");
}

export async function createPatchPullRequest(context: RepoContext, runId: string, diff: string, title: string) {
  const branch = `${CONFIG.github.branchPrefix}${runId}`;
  await github(`/repos/${context.owner}/${context.repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: context.headSha }) });
  const parentCommit = await github<{ tree: { sha: string } }>(`/repos/${context.owner}/${context.repo}/git/commits/${context.headSha}`);
  const changes: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const patch of parseUnifiedDiff(diff)) {
    if (!context.tree.includes(patch.path)) throw new Error(`Patch references unknown file: ${patch.path}`);
    const content = applyPatch(await readFile(context, patch.path, context.headSha), patch);
    const blob = await github<{ sha: string }>(`/repos/${context.owner}/${context.repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content, encoding: "utf-8" }) });
    changes.push({ path: patch.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const tree = await github<{ sha: string }>(`/repos/${context.owner}/${context.repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: changes }) });
  const commit = await github<{ sha: string }>(`/repos/${context.owner}/${context.repo}/git/commits`, { method: "POST", body: JSON.stringify({ message: `fix: ${title}`, tree: tree.sha, parents: [context.headSha] }) });
  await github(`/repos/${context.owner}/${context.repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
  const pr = await github<{ number: number; html_url: string }>(`/repos/${context.owner}/${context.repo}/pulls`, { method: "POST", body: JSON.stringify({ title: `VERDICT: ${title}`, head: branch, base: context.defaultBranch, body: "Automated draft patch from VERDICT. Review the cited evidence and CI proof before applying.", draft: true }) });
  return { branch, prNumber: pr.number, prUrl: pr.html_url, sha: commit.sha };
}

export async function getCheckRuns(repo: RepoRef, ref: string) {
  return github<{ check_runs: { id: number; name: string; status: string; conclusion: string | null; details_url: string }[] }>(`/repos/${repo.owner}/${repo.repo}/commits/${encodeURIComponent(ref)}/check-runs?per_page=100`);
}

export async function triggerTestWorkflow(repo: RepoRef, ref: string) {
  const data = await github<{ workflows: { id: number; name: string; path: string; state: string }[] }>(`/repos/${repo.owner}/${repo.repo}/actions/workflows?per_page=100`);
  const active = data.workflows.filter((workflow) => workflow.state === "active");
  const workflow = active.find((item) => /(^|\b)(test|ci|verify|check)(\b|$)/i.test(`${item.name} ${item.path}`)) ?? active[0];
  if (!workflow) return { triggered: false, reason: "No active GitHub Actions workflow exists." };
  try {
    await github(`/repos/${repo.owner}/${repo.repo}/actions/workflows/${workflow.id}/dispatches`, { method: "POST", body: JSON.stringify({ ref }) });
    return { triggered: true, workflow: workflow.name };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow dispatch failed.";
    if (message.includes("422")) return { triggered: false, workflow: workflow.name, reason: "Workflow does not support workflow_dispatch; relying on its push trigger." };
    throw error;
  }
}

export async function mergePullRequest(repo: RepoRef, prNumber: number) {
  return github<{ merged: boolean; message: string; sha?: string }>(`/repos/${repo.owner}/${repo.repo}/pulls/${prNumber}/merge`, { method: "PUT", body: JSON.stringify({ merge_method: "squash" }) });
}
