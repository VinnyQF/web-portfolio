ARG NODE_IMAGE=node:26-alpine3.23
ARG NGINX_IMAGE=nginx:stable-alpine
FROM ${NODE_IMAGE} AS tooling
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
FROM tooling AS build
RUN npm run build

FROM ${NGINX_IMAGE} AS runtime
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
