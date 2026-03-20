FROM ruby:3.4.5-slim AS base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    libxml2-dev \
    libxslt-dev \
    libyaml-dev \
    zlib1g-dev \
    pkg-config \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install --no-install-recommends -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS gems

COPY Gemfile Gemfile.lock .ruby-version ./
RUN bundle install --jobs 4 --retry 3

FROM base AS app

COPY --from=gems /usr/local/bundle /usr/local/bundle

COPY . .

RUN npm ci --ignore-scripts && \
    npm run postinstall --workspace=@18f/identity-analytics 2>/dev/null || true

RUN rm -rf certs keys && \
    cp -r certs.example certs && \
    cp -r keys.example keys && \
    cp pwned_passwords/pwned_passwords.txt.sample pwned_passwords/pwned_passwords.txt && \
    mkdir -p tmp/pids log app/assets/builds

RUN for f in service_providers agencies iaa_gtcs iaa_orders iaa_statuses \
    integration_statuses integrations partner_account_statuses partner_accounts; do \
    if [ -f "config/${f}.localdev.yml" ]; then \
      rm -f "config/${f}.yml"; \
      cp "config/${f}.localdev.yml" "config/${f}.yml"; \
    fi; \
    done

RUN cp config/application.yml.default config/application.yml

RUN npm run build:js && npm run build:css

EXPOSE 3000

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["web"]
