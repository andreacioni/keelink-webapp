/** @type {import('next').NextConfig} */
const nextConfig = {
  //generate static pages and put them in out/ folder
  //output: "export",
  images: {
    //unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.paypalobjects.com",
        port: "",
        pathname: "/it_IT/**",
      },
    ],
  },
};

module.exports = nextConfig;
