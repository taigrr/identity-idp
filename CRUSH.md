# CRUSH Configuration for identity-idp

## Build/Test/Lint Commands
- **Ruby tests**: `bundle exec rspec` (all), `bundle exec rspec spec/path/to/file_spec.rb` (single file)
- **JavaScript tests**: `yarn test` (all), `yarn test --grep "test name"` (single test)
- **Ruby lint**: `bundle exec rubocop` (check), `bundle exec rubocop -a` (auto-fix)
- **JavaScript lint**: `yarn lint` (check), `yarn lint --fix` (auto-fix)
- **CSS lint**: `yarn lint:css`
- **TypeScript check**: `yarn typecheck`
- **Build assets**: `yarn build` or `make build`
- **OpenAPI lint**: `yarn lint:openapi`

## Code Style Guidelines
- **Ruby**: Follow .rubocop.yml config, 100 char line limit, single quotes, trailing commas
- **JavaScript/TypeScript**: ESLint config with @18f/eslint-plugin-identity, React hooks rules
- **Imports**: Use frozen_string_literal comment in Ruby files
- **Components**: ViewComponent pattern for Ruby, React 17 for JS/TS
- **Naming**: snake_case for Ruby, camelCase for JS/TS, PascalCase for components
- **Error handling**: Use Rails conventions, proper exception classes
- **Types**: Strict TypeScript, avoid `any`, use specific types
- **Testing**: RSpec for Ruby (spec/), Mocha for JS (spec/javascript/)
- **Formatting**: 2-space indentation, no trailing whitespace