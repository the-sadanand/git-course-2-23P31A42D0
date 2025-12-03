#!/bin/sh
set -e

# Ensure logs directory exists
mkdir -p /cron
chmod 755 /cron

# Start cron daemon (background)
# On Debian, "cron" starts as a background service
cron

# Print startup info to stdout
echo "$(date -u '+%Y-%m-%d %H:%M:%S') - Starting app (UTC)"

# Exec npm start as PID 1 so container exits if it crashes
exec npm start
