import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { Logo } from "./Logo";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Primary navigation">
          <a href="/#how" className="transition-colors hover:text-text">How it works</a>
          <Link href="/demo" className="transition-colors hover:text-text">Demo</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-text"><Github className="size-4" /> GitHub</a>
        </nav>
        <Link href="/demo" className="group inline-flex items-center gap-2 rounded-full bg-text px-4 py-2.5 text-sm font-semibold text-bg transition hover:bg-emerald focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-bg">
          Try it <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </header>
  );
}
