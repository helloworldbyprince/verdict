import { afterEach, describe, expect, it, vi } from "vitest";

const original = process.env.GITHUB_ALLOWED_REPOS;

afterEach(() => {
  process.env.GITHUB_ALLOWED_REPOS = original;
  vi.resetModules();
});

describe("GitHub repository allowlist", () => {
  it("normalizes a valid GitHub URL", async () => {
    const { parseRepoUrl } = await import("./github");
    expect(parseRepoUrl("https://github.com/HelloWorldByPrince/verdict.git")).toEqual({ owner: "HelloWorldByPrince", repo: "verdict" });
  });

  it("rejects non-GitHub URLs", async () => {
    const { parseRepoUrl } = await import("./github");
    expect(() => parseRepoUrl("https://example.com/owner/repo")).toThrow("github.com");
  });

  it("allows only explicitly configured repositories", async () => {
    process.env.GITHUB_ALLOWED_REPOS = "helloworldbyprince/verdict";
    vi.resetModules();
    const { assertRepoAllowed } = await import("./github");
    expect(assertRepoAllowed("https://github.com/helloworldbyprince/verdict")).toEqual({ owner: "helloworldbyprince", repo: "verdict" });
    expect(() => assertRepoAllowed("https://github.com/helloworldbyprince/another-repo")).toThrow("not authorized");
  });
});
