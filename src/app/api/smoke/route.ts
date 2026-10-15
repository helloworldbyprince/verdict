import { NextResponse } from "next/server";
import { askNemotron } from "@/lib/nebius";

export async function GET() {
  const started = Date.now();
  try {
    const reply = await askNemotron({ role: "fast", system: "Follow the instruction exactly.", prompt: "Reply with the word OK" });
    return NextResponse.json({ reply, latencyMs: Date.now() - started });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Smoke test failed", latencyMs: Date.now() - started }, { status: 503 });
  }
}
