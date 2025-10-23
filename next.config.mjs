/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.reuters.com",
      },
      {
        protocol: "https",
        hostname: "**.bbc.com",
      },
      {
        protocol: "https",
        hostname: "**.bbc.co.uk",
      },
      {
        protocol: "https",
        hostname: "**.yna.co.kr",
      },
      {
        protocol: "https",
        hostname: "news.google.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.guim.co.uk",
      },
      {
        protocol: "https",
        hostname: "**.theguardian.com",
      },
      {
        protocol: "https",
        hostname: "**.redd.it",
      },
      {
        protocol: "https",
        hostname: "**.redditstatic.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.akamaized.net",
      },
      {
        protocol: "https",
        hostname: "**.techcrunch.com",
      },
      {
        protocol: "https",
        hostname: "**.technologyreview.com",
      },
      {
        protocol: "https",
        hostname: "**.cnn.com",
      },
      {
        protocol: "https",
        hostname: "**.sbs.co.kr",
      },
      {
        protocol: "https",
        hostname: "**.nytimes.com",
      },
      {
        protocol: "https",
        hostname: "**.wp.com",
      },
      {
        protocol: "https",
        hostname: "**.imgur.com",
      },
      {
        protocol: "https",
        hostname: "**.naver.com",
      },
      {
        protocol: "https",
        hostname: "**.reddit.com",
      },
    ],
    unoptimized: true,
  },
}

export default nextConfig
