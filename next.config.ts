import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only "N" badge: keep it off the sidebar profile avatar (bottom-left)
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
