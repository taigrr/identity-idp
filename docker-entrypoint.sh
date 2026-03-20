#!/bin/bash
set -e

wait_for_db() {
  echo "==> Waiting for database to be ready..."
  for i in $(seq 1 30); do
    if bundle exec rails runner "ActiveRecord::Base.connection" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  echo "Database not ready after 60s"
  return 1
}

if [ -n "$DOCKER_REDIS_HOST" ]; then
  echo "==> Patching application.yml for Docker Redis..."
  sed -i "s|redis://localhost:6379|redis://${DOCKER_REDIS_HOST}:6379|g" config/application.yml
fi

case "$1" in
  web)
    echo "==> Preparing database..."
    bundle exec rails db:create 2>/dev/null || true
    bundle exec rails db:migrate 2>/dev/null || bundle exec rails db:schema:load
    echo "==> Priming dev data..."
    bundle exec rails dev:prime 2>/dev/null || true
    echo "==> Starting web server..."
    exec bundle exec rackup config.ru --port 3000 --host 0.0.0.0
    ;;
  worker)
    wait_for_db
    echo "==> Waiting for migrations to complete..."
    sleep 10
    exec bundle exec good_job start
    ;;
  *)
    exec "$@"
    ;;
esac
