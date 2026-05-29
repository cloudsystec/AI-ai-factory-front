#!/bin/sh
set -e

# Gera /runtime-config.js a partir das variáveis do Railway (runtime), sem rebuild.
# Aceita VITE_* ou STRIPE_CHECKOUT_* (sem prefixo).

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

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
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
