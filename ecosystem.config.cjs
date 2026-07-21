/**
 * PM2 — Sebavio production
 * Secrets : chargés via .env (cwd), jamais versionnés ici.
 */
module.exports = {
  apps: [
    {
      name: "sebavio",
      cwd: "/var/www/sebavio.com",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3050",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3050",
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
