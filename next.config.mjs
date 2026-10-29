/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Next defaults to one build worker per CPU core, which can run a small VPS out of memory.
  experimental: { cpus: 2 },
  // Hides the floating Next.js "N" badge that sits on top of the sidebar in dev.
  devIndicators: false,
  // "Issues" were renamed to "Tasks"; keep old bookmarks working.
  redirects() {
    return [{ source: "/issues", destination: "/tasks", permanent: false }];
  },
};

export default nextConfig;
