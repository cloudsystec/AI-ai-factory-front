#!/bin/sh
set -e

# Gera /runtime-config.js e nginx (proxy opcional para API) a partir das variáveis Railway.
# Aceita VITE_* ou nomes curtos (sem prefixo).

pick() {
  var_name="$1"
  eval "v=\${$var_name}"
  if [ -n "$v" ]; then
    printf '%s' "$v"
    return
  fi
  short=$(echo "$var_name" | sed 's/^VITE_//')
  eval "v=\${$short}"
  printf '%s' "$v"
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

S_STARTER=$(json_escape "$(pick VITE_STRIPE_CHECKOUT_STARTER)")
S_TEAM=$(json_escape "$(pick VITE_STRIPE_CHECKOUT_TEAM)")
S_SCALE=$(json_escape "$(pick VITE_STRIPE_CHECKOUT_SCALE)")
S_BUSINESS=$(json_escape "$(pick VITE_STRIPE_CHECKOUT_BUSINESS)")
S_EMAIL=$(json_escape "$(pick VITE_SALES_EMAIL)")

BACKEND_PROXY_URL="$(pick BACKEND_PROXY_URL)"
VITE_API_URL="$(pick VITE_API_URL)"
API_URL_RUNTIME=""

if [ -n "$BACKEND_PROXY_URL" ]; then
  BACKEND_PROXY_URL="${BACKEND_PROXY_URL%/}"
  API_URL_RUNTIME=""
  cat > /etc/nginx/conf.d/default.conf <<EOF
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass ${BACKEND_PROXY_URL}/api/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300s;
  }

  location /ws {
    proxy_pass ${BACKEND_PROXY_URL}/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 3600s;
  }

  location /worker/ {
    proxy_pass ${BACKEND_PROXY_URL}/worker/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location /admin/ {
    proxy_pass ${BACKEND_PROXY_URL}/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location /health {
    proxy_pass ${BACKEND_PROXY_URL}/health;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
EOF
elif [ -n "$VITE_API_URL" ]; then
  VITE_API_URL="${VITE_API_URL%/}"
  API_URL_RUNTIME="$VITE_API_URL"
fi

API_URL_ESCAPED=$(json_escape "$API_URL_RUNTIME")

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  "apiUrl": "${API_URL_ESCAPED}",
  "stripeCheckout": {
    "starter": "${S_STARTER}",
    "team": "${S_TEAM}",
    "scale": "${S_SCALE}",
    "business": "${S_BUSINESS}"
  },
  "salesEmail": "${S_EMAIL}"
};
EOF

exec nginx -g 'daemon off;'
