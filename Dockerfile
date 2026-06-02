FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Build-time (opcional; Railway também pode injectar em runtime via entrypoint)
ARG VITE_API_URL=
ARG VITE_STRIPE_CHECKOUT_STARTER=
ARG VITE_STRIPE_CHECKOUT_TEAM=
ARG VITE_STRIPE_CHECKOUT_SCALE=
ARG VITE_STRIPE_CHECKOUT_BUSINESS=
ARG VITE_SALES_EMAIL=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STRIPE_CHECKOUT_STARTER=$VITE_STRIPE_CHECKOUT_STARTER \
    VITE_STRIPE_CHECKOUT_TEAM=$VITE_STRIPE_CHECKOUT_TEAM \
    VITE_STRIPE_CHECKOUT_SCALE=$VITE_STRIPE_CHECKOUT_SCALE \
    VITE_STRIPE_CHECKOUT_BUSINESS=$VITE_STRIPE_CHECKOUT_BUSINESS \
    VITE_SALES_EMAIL=$VITE_SALES_EMAIL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
