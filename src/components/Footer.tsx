import { Github } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted">Built with NVIDIA Nemotron on Nebius Token Factory · MIT licensed</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted">
          <span>Nebius × NVIDIA Global AI Hackathon 2026</span>
          <a href="https://github.com" aria-label="GitHub" className="hover:text-text"><Github className="size-4" /></a>
        </div>
      </div>
    </footer>
  );
}
