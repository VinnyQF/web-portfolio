# web-portifolio

My personal portfolio, built with Astro. Available in English and Brazilian
Portuguese.

## Quick start

Requires Docker with Docker Compose.

```sh
git clone https://github.com/VinnyQF/web-portifolio.git
cd web-portifolio
docker compose up -d --build --wait portfolio
```

Open http://localhost:4321. Run the same Compose command after changing
the source to rebuild and update the site. Stop it with `docker compose down`.

For access from other devices on your network, copy `.env.example` to
`.env` before starting, then open `http://<computer-ip>:4321`.

## Development

With Node.js 26:

```sh
npm ci
npm run dev
```

Run `npm test` to build and test the site. With the Docker container
running, `npm run test:container` checks its HTTP responses.
GitHub Actions runs both suites on pushes and pull requests.

Repository data uses a saved snapshot. To refresh it and rebuild the
container on Linux, run `sh scripts/refresh-site.sh` as a user with
Docker access. Optional scheduling is shown in [docker/repositories.cron](docker/repositories.cron).

## License

Source code: [MIT](LICENSE). The portrait, logo, and favicon are excluded;
see [personal asset terms](src/assets/LICENSE.md). Replace these assets
when adapting the website for your own use.
