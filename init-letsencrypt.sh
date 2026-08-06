#!/bin/bash
# One-time bootstrap: nginx refuses to start without a certificate at
# /etc/letsencrypt/live/<domain>/, but certbot can't obtain a real
# certificate until nginx is up to serve the ACME challenge. This script
# breaks that chicken-and-egg problem with a throwaway self-signed cert.
set -e
cd "$(dirname "$0")"

domain="almadrive.kz"
domain_args=(-d almadrive.kz -d www.almadrive.kz)
rsa_key_size=4096
email="kulmatovyaroslav@gmail.com"

echo "### Creating dummy certificate for $domain ..."
docker compose run --rm --entrypoint "\
  sh -c 'mkdir -p /etc/letsencrypt/live/$domain && \
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout /etc/letsencrypt/live/$domain/privkey.pem \
    -out /etc/letsencrypt/live/$domain/fullchain.pem \
    -subj \"/CN=localhost\"'" certbot

echo "### Starting nginx ..."
docker compose up -d nginx

echo "### Deleting dummy certificate ..."
docker compose run --rm --entrypoint "\
  sh -c 'rm -rf /etc/letsencrypt/live/$domain && \
  rm -rf /etc/letsencrypt/archive/$domain && \
  rm -rf /etc/letsencrypt/renewal/$domain.conf'" certbot

echo "### Requesting real Let's Encrypt certificate for ${domain_args[*]} ..."
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  "${domain_args[@]}" \
  --email "$email" \
  --rsa-key-size "$rsa_key_size" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload

echo "=== Done! https://$domain should now serve a valid certificate. ==="
