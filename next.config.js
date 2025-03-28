/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
    ],
  },
  
};


module.exports = nextConfig;


