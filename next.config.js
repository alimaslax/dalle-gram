module.exports = {
  images: {
    formats: ["image/avif", "image/webp"],
    domains: [
      "res.cloudinary.com",
      "scontent-ord5-1.cdninstagram.com",
      "scontent-ord5-2.cdninstagram.com",
      "i.imgur.com",
      "oaidalleapiprodscus.blob.core.windows.net",
      "api.openai.com",
      "scontent-iad3-1.cdninstagram.com",
      "scontent-iad3-2.cdninstagram.com"
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude https-proxy-agent from client-side build
    if (!isServer) {
      config.externals.push("https-proxy-agent");
    }

    return config;
  },
};

const server = require('./server');

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
          },
        ],
      },
    ];
  },
  async start() {
    await server.listen(process.env.PORT || 3000);
  },
};
