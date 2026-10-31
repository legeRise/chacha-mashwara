#!/usr/bin/env bash
# Build the UI and publish it under the server's existing nginx domain.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI="$ROOT/ui"
TARGET="/var/www/chacha"
URL="https://openchamber.ez-clip.ovh/chacha/"

cd "$UI"
npm run build

sudo mkdir -p "$TARGET"
sudo rsync -a --delete "$UI/dist/" "$TARGET/"
sudo chown -R www-data:www-data "$TARGET"

sudo nginx -t
sudo systemctl reload nginx

echo "Deployed: $URL"
