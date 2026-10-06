module.exports = {
  apps: [
    {
      name: "manygames",
      script: "./server.js",
      cwd: "/path/to/manygames",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        SITE_URL: "https://yourdomain.com",
      },
    },
  ],
};
