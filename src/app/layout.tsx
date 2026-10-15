import type { Metadata } from "next";
import { JetBrains_Mono, Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "VERDICT — Don't trust the agent. Verify it.",
  description: "A coding agent that proves it fixed your bug with deterministic CI evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lexend.variable} ${jetbrains.variable}`}>
      <body className="grain font-sans antialiased">{children}</body>
    </html>
  );
}
