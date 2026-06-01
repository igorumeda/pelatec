const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com"
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https",
              hostname: supabaseHost
            }
          ]
        : [])
    ]
  }
};

export default nextConfig;
