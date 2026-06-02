import type { NextConfig } from "next";

/* Allow next/image to source from Supabase Storage. Without this the
 * homepage "From the journal" cards (which render blog_post.image_url
 * from the content-images bucket) crash the build with the
 * "hostname not configured" error. The public Storage CDN sits at
 *   https://<project-ref>.supabase.co/storage/v1/object/public/...
 * so we whitelist *.supabase.co. */
const SUPABASE_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
