module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['res.cloudinary.com','scontent-ord5-1.cdninstagram.com','scontent-ord5-2.cdninstagram.com', 'i.imgur.com'
  ,'oaidalleapiprodscus.blob.core.windows.net'],
  },
  webpack: (config, { isServer }) => {
    // Exclude https-proxy-agent from client-side build
    if (!isServer) {
      config.externals.push("https-proxy-agent");
    }

    return config;
  },
}
