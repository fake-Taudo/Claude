import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js legt sonst automatisch AGENTS.md / CLAUDE.md im Projekt an
  agentRules: false,
  poweredByHeader: false,
};

export default nextConfig;
