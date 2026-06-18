import type { NextConfig } from "next";

// En GitHub Pages (project page) la app vive bajo /naturoutes.
// El workflow de deploy setea GITHUB_PAGES=true; en local queda en root.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = "naturoutes";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGithubPages ? `/${repo}` : undefined,
  assetPrefix: isGithubPages ? `/${repo}/` : undefined,
};

export default nextConfig;
