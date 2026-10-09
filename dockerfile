FROM node:26-alpine3.23 AS runtime
WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

COPY docker/repositories.cron /etc/portfolio-crontabs/root

ENV HOST=0.0.0.0
ENV PORT=4321
ENV TZ=UTC
EXPOSE 4321
CMD ["sh", "-c", "crond -b -c /etc/portfolio-crontabs -L /proc/1/fd/2 && exec npm run preview -- --host 0.0.0.0 --port 4321"]
