import type { NextConfig } from "next";

// En GitHub Pages (project page) la app vive bajo /naturoutes.
// El workflow de deploy setea GITHUB_PAGES=true; en local queda en root.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = "naturoutes";
const basePath = isGithubPages ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: isGithubPages ? `/${repo}/` : undefined,
  // Exposed to client + manifest so PWA paths respect the GitHub Pages basePath.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
