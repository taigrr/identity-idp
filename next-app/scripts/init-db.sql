-- Initialize PostgreSQL extensions required by the application
-- This runs automatically when the container starts

-- Enable citext for case-insensitive text (used for email domains)
CREATE EXTENSION IF NOT EXISTS citext;

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE identity_idp TO idp_admin;
