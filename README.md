# web-portifolio
This repository hosts my personal website that gives a brief explanation as to who I am, and what I develop.

## License

The source code is licensed under the [MIT License](LICENSE).

The personal portrait, logo, and favicon are excluded from that
license. See [personal asset terms](src/assets/LICENSE.md).
Replace these assets when adapting the website for your own use.

## Running with Docker

Requirements: Docker with the Docker Compose plugin (`docker compose`).
Node.js is only needed for development outside Docker.

```sh
git clone https://github.com/VinnyQF/web-portifolio.git
cd web-portifolio
docker compose up -d --build
```

Open http://localhost:4321.

After changing the source files, run the same command again
to rebuild the image and update the container.

View logs:

```sh
docker compose logs -f
```

Stop the container:

```sh
docker compose down
```

## Architecture

The Dockerfile installs locked dependencies with `npm ci`, builds Astro,
and copies only `dist/` into the Nginx runtime image. The web container
runs as the `nginx` user with a read-only filesystem and a temporary
directory for Nginx runtime files. Node.js and build tools are absent
from the final image.

Nginx serves all four static routes, compresses text responses, and
caches Astro's hashed assets for one year. HTML is revalidated so new
deployments can be discovered. Unknown routes return HTTP 404.
The health check uses `/healthz`. Request access logs are disabled;
server error logs remain available for troubleshooting. No analytics
or tracking service is added.

Builds use the committed snapshot in `src/data/repositories.json`;
they do not query GitHub. Commit `package-lock.json` alongside dependency
changes. Base image tags can change: for stricter reproducibility, pass
`NODE_IMAGE` and `NGINX_IMAGE` build arguments containing tested image
digests, and update those digests deliberately over time.

## Configuration and LAN testing

Without a `.env` file, Compose binds to `127.0.0.1`, making the site
accessible only on the Docker host. For LAN testing, copy the example:

```sh
cp .env.example .env
docker compose up -d --build --wait portfolio
```

The example sets `PORTFOLIO_BIND=0.0.0.0` and `PORTFOLIO_PORT=4321`.
This accepts connections on all host interfaces, subject to the firewall.
Open `http://<computer-ip>:4321` from another device; `0.0.0.0` is the
bind address, not the address to enter in the browser.

Keep `.env.example` in Git as a template. `.env` is local configuration,
ignored by Git and excluded from the Docker build context. Compose reads
it automatically. If your Docker setup requires elevated privileges,
prefix Docker commands with `sudo`.

`PORTFOLIO_PORT` selects the host port; Nginx always listens on port 8080
inside the container. Relative redirects preserve the external address,
port, and protocol. After changing `.env`, recreate the service with
`docker compose up -d --wait portfolio`; an image rebuild is not needed
for a port or bind change.

## Refreshing repository data

The updater runs separately from the web server. On a Linux host, run
as the user who owns the checkout and has Docker access:

```sh
sh scripts/refresh-site.sh
```

This uses a temporary Node container to write the snapshot into the
checkout, builds a new web image, and recreates the web service only
after both steps succeed. A refresh or build failure leaves the current
web container running. Recreation can cause a brief interruption;
this is not a zero-downtime deployment. A startup failure after recreation
requires restoring the previous image or checkout and redeploying.

The refresh writes `src/data/repositories.json` locally; it does not
commit or push changes. An optional `GITHUB_TOKEN` in `.env` is passed
only to the updater, never baked into the web image.

For weekly refreshes, adapt `docker/repositories.cron` and install its
job using the host user's `crontab -e`. Replace the example absolute
paths. Scheduling follows the host timezone; `0 3 * * 1` means Monday
at 03:00 in that timezone. The example requires `flock` and writes to
`refresh.log`. Rotate that log as needed. The old cron inside the web
container is no longer used.

## Development

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

The development server automatically reloads changed source files.
For a build check, run `npm run build`.

GitHub Actions builds and starts the production container on pushes and
pull requests, checks the Nginx configuration, verifies the four routes,
and checks 404 responses and cache headers. It does not deploy the site
or refresh repository metadata.
