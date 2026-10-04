/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? "/franchise-os" : "",
  assetPrefix: isGithubPages ? "/franchise-os/" : ""
};

export default nextConfig;
