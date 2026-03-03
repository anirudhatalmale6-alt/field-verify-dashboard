module.exports = {
  apps: [{
    name: 'field-verify',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/field-verify-dashboard',
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: 'kospl-field-verify-2026-secret-key',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
  }],
};
