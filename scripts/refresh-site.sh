#!/bin/sh
set -eu

project_directory=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_directory"
export LOCAL_UID="$(id -u)"
export LOCAL_GID="$(id -g)"

docker compose run --rm --build repositories
docker compose build portfolio
docker compose up -d --no-build --wait portfolio
