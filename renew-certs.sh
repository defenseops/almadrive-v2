#!/bin/bash
set -e
cd "$(dirname "$0")"

docker compose run --rm certbot renew --webroot -w /var/www/certbot --quiet
docker compose exec nginx nginx -s reload

echo "Certificates renewed and nginx reloaded: $(date)"
