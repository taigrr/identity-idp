# Login.gov Identity IDP: Fullstack TypeScript Migration Plan

> **Goal**: Migrate from Ruby on Rails to a fullstack TypeScript architecture suitable for TanStack Start or Next.js while preserving all existing functionality.

## Executive Summary

This is a **large-scale migration** of a government identity verification platform. The current Rails app has:

| Component | Count/Details |
|-----------|---------------|
| **Database Tables** | ~45 tables (PostgreSQL with citext, pg_stat_statements extensions) |
| **ActiveRecord Models** | ~55 models |
| **Controllers** | ~130 controllers across multiple namespaces |
| **Views** | ~300+ ERB templates |
| **Frontend** | React 19 + Vite + TypeScript (already modern) |
| **API Endpoints** | JSON APIs, OpenID Connect, SAML IdP, Attempts API (SSF/RISC) |
| **Background Jobs** | GoodJob (PostgreSQL-based) |
| **External Services** | AWS (KMS, SES, SNS, SQS, Pinpoint), Redis, USPS, LexisNexis, Socure |

---

## Phase 0: Prerequisites & Planning (2-4 weeks)

### 0.1 Choose Target Framework

| Framework | Pros | Cons | Recommendation |
|-----------|------|------|----------------|
| **TanStack Start** | Modern, flexible, React Router v7, growing ecosystem | Newer, less battle-tested, smaller community | Best for greenfield, maximum flexibility |
| **Next.js** | Mature, large ecosystem, excellent DX, Vercel support | More opinionated, some lock-in | Best for enterprise, stability matters |

**Recommendation**: **Next.js App Router** for this project due to:
- Government compliance requirements favor stability
- Larger talent pool for maintenance
- Better documentation for complex auth flows
- Server Actions align well with form-heavy identity flows

### 0.2 Technical Decisions Required

1. **ORM**: Drizzle (type-safe, lightweight) vs Prisma (mature, more features)
2. **Auth**: Lucia Auth, Auth.js, or custom (given SAML/OIDC complexity, likely custom)
3. **Validation**: Zod (already compatible with TypeScript)
4. **API Layer**: tRPC (internal) + REST/OpenAPI (external APIs)
5. **Background Jobs**: BullMQ (Redis) or Trigger.dev
6. **Email**: React Email + Resend or existing AWS SES
7. **Session Storage**: Keep Redis (already in use)

---

## Phase 1: Database & Schema Migration (4-6 weeks)

### 1.1 Generate TypeScript Schema from PostgreSQL

```bash
# Using Drizzle Kit to introspect existing database
npx drizzle-kit introspect:pg
```

### 1.2 Key Schema Considerations

The current schema has complex features that need careful mapping:

| Rails Feature | TypeScript Equivalent |
|---------------|----------------------|
| `citext` extension | Custom Drizzle type or Prisma extension |
| `jsonb` columns | Native JSON type with Zod validation |
| Encrypted columns (`encrypted_*`) | Custom encryption middleware |
| `sensitive=true/false` comments | Annotation system for PII handling |
| Polymorphic associations | Discriminated unions |
| STI (Single Table Inheritance) | Not detected, but verify |

### 1.3 Critical Tables Requiring Special Handling

```
users                    - Core identity, encrypted email
profiles                 - Encrypted PII (multi-region!)
email_addresses          - Encrypted email with fingerprinting
phone_configurations     - Encrypted phone numbers
identities               - OAuth/SAML sessions
in_person_enrollments    - Complex state machine
document_capture_sessions - Async verification state
```

### 1.4 Migration Scripts

Create data migration scripts for:
1. Encryption key compatibility (KMS integration)
2. Session format conversion (Redis)
3. Background job migration (GoodJob → BullMQ)

---

## Phase 2: Core Infrastructure (6-8 weeks)

### 2.1 Project Structure

```
/app
  /api                    # API routes (REST + tRPC)
    /openid-connect       # OIDC endpoints
    /saml                 # SAML IdP endpoints
    /attempts             # SSF/RISC Attempts API
    /internal             # Internal APIs
  /(auth)                 # Auth flow pages
    /login
    /signup
    /two-factor
    /account-reset
  /(idv)                  # Identity verification flow
    /verify
    /document-capture
    /in-person
  /(account)              # Account management
  /components             # Shared components
/lib
  /db                     # Database schema & queries
  /auth                   # Auth utilities
  /encryption             # KMS & encryption services
  /saml                   # SAML IdP implementation
  /oidc                   # OIDC provider implementation
  /services               # Business logic (port from app/services)
  /telephony              # SMS/Voice via Pinpoint
/workers                  # Background job definitions
```

### 2.2 Port Critical Services

Priority order for `app/services/` migration:

1. **Authentication & Sessions**
   - `encryption/*` - AES, KMS client, password verifier
   - `auth_methods_session.rb`
   - `session_encryptor.rb`

2. **Identity Verification**
   - `idv/*` - Document auth, proofing, phone verification
   - `doc_auth/*` - LexisNexis, Socure integrations
   - `proofing/*` - AAMVA, address verification

3. **Federation**
   - `saml_*` - SAML IdP (uses `saml_idp` gem, needs TypeScript equivalent)
   - `openid_connect_*` - OIDC provider
   - `id_token_builder.rb`

4. **Communications**
   - `telephony.rb` - AWS Pinpoint SMS/Voice
   - `push_notification/*` - RISC push events

### 2.3 External Service Integrations

| Service | Current Gem | TypeScript Equivalent |
|---------|-------------|----------------------|
| AWS KMS | `aws-sdk-kms` | `@aws-sdk/client-kms` |
| AWS SES | `aws-sdk-ses` | `@aws-sdk/client-ses` |
| AWS Pinpoint | `aws-sdk-pinpoint*` | `@aws-sdk/client-pinpoint*` |
| Redis | `redis` gem | `ioredis` |
| Faraday HTTP | `faraday` | `ky` or `got` |
| SAML | `ruby-saml`, `saml_idp` | `saml2-js` or custom |
| WebAuthn | `webauthn` gem | `@simplewebauthn/server` |

---

## Phase 3: Authentication System (8-10 weeks)

### 3.1 Multi-Factor Authentication

Current MFA methods to implement:
- [x] TOTP (Authenticator apps)
- [x] WebAuthn (Security keys, passkeys)
- [x] SMS OTP
- [x] Voice OTP
- [x] PIV/CAC (Smart cards - complex!)
- [x] Backup codes
- [x] Personal key (account recovery)

### 3.2 SAML IdP Implementation

This is the most complex part. Current implementation uses `saml_idp` gem.

Options:
1. **Port ruby-saml/saml_idp logic** - Full control, significant effort
2. **Use saml2-js** - Less mature but TypeScript native
3. **Keep SAML as separate Ruby microservice** - Pragmatic interim solution

Recommended: **Hybrid approach** - Keep SAML in Ruby microservice initially, migrate later.

### 3.3 OpenID Connect Provider

Implement OIDC endpoints:
```
/.well-known/openid-configuration
/api/openid_connect/certs
/api/openid_connect/token
/api/openid_connect/userinfo
/openid_connect/authorize
/openid_connect/logout
```

Library options: `oidc-provider` (Node.js), custom implementation

---

## Phase 4: Identity Verification (IDV) Flow (8-10 weeks)

### 4.1 Document Verification

Port integrations:
- **Socure** - Document capture SDK, DocV API
- **LexisNexis TrueID** - Document authentication
- **AAMVA** - DMV verification

### 4.2 In-Person Proofing

Complex state machine for USPS integration:
- Enrollment creation
- Status polling
- Ready for verification states
- Batch processing

### 4.3 Fraud Detection

- ThreatMetrix device profiling
- Manual fraud review workflow
- Duplicate profile detection

---

## Phase 5: Frontend Migration (4-6 weeks)

### 5.1 Current State (Already Good!)

- React 19 ✅
- TypeScript ✅
- Vite 8 ✅
- TailwindCSS 4 ✅
- Testing Library ✅

### 5.2 Migration Tasks

1. **Replace ERB layouts** with React/Next.js layouts
2. **Port view components** (already using `view_component` gem)
3. **Convert i18n** from Rails I18n to `next-intl` or similar
4. **Port USWDS/design system** integration (`@18f/identity-design-system`)

### 5.3 Form Handling

Current: `simple_form` + Rails form helpers
Target: React Hook Form + Zod + Server Actions

---

## Phase 6: Background Jobs & Email (2-4 weeks)

### 6.1 Background Jobs

Current: GoodJob (PostgreSQL-based)
Target: BullMQ or Trigger.dev

Job types to migrate:
- GPO letter sending/status checking
- In-person enrollment status polling
- Account deletion
- Fraud review processing
- Analytics/reporting

### 6.2 Email Templates

Current: ERB + Premailer + Foundation Emails
Target: React Email

~45 email templates in `app/views/user_mailer/`

---

## Phase 7: Testing & Compliance (Ongoing)

### 7.1 Test Coverage

Current: RSpec + Mocha
Target: Vitest + Playwright

### 7.2 Security Compliance

- NIST 800-63 identity proofing requirements
- FedRAMP compliance
- Accessibility (WCAG 2.1 AA)
- SAML/OIDC conformance testing

---

## Migration Strategy: Strangler Fig Pattern

### Phase A: API Gateway (Month 1-2)
Deploy Next.js app alongside Rails, proxy requests through new app.

### Phase B: New Features in TypeScript (Month 2-6)
Build new features in Next.js, keep existing Rails features.

### Phase C: Incremental Migration (Month 6-18)
Migrate feature-by-feature:
1. Account management pages
2. Sign-up flow
3. Sign-in flow (excluding SAML)
4. IDV flows
5. SAML/OIDC (last, most complex)

### Phase D: Decommission Rails (Month 18-24)
Final cutover, remove Rails entirely.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SAML compliance issues | High | Critical | Keep Ruby SAML service initially |
| Encryption key migration | Medium | Critical | Extensive testing, gradual rollout |
| Performance regression | Medium | High | Load testing, feature flags |
| Feature parity gaps | Medium | Medium | Comprehensive feature inventory |
| Team TypeScript proficiency | Low | Medium | Training, pair programming |

---

## Resource Estimates

| Phase | Duration | Team Size | Notes |
|-------|----------|-----------|-------|
| Phase 0 | 2-4 weeks | 2-3 | Planning, decisions |
| Phase 1 | 4-6 weeks | 2-3 | Database, schema |
| Phase 2 | 6-8 weeks | 4-5 | Core infrastructure |
| Phase 3 | 8-10 weeks | 4-5 | Auth (most complex) |
| Phase 4 | 8-10 weeks | 4-5 | IDV flows |
| Phase 5 | 4-6 weeks | 3-4 | Frontend |
| Phase 6 | 2-4 weeks | 2-3 | Jobs, email |
| Phase 7 | Ongoing | 2-3 | Testing, compliance |

**Total**: 18-24 months with 4-5 engineers

---

## Quick Wins (Can Start Immediately)

1. **Set up Next.js project** alongside Rails
2. **Generate Drizzle schema** from existing PostgreSQL
3. **Port frontend-only components** (already React/TS)
4. **Create TypeScript API clients** for existing Rails APIs
5. **Set up shared auth middleware** for gradual migration

---

## Files to Reference

| Area | Key Files |
|------|-----------|
| Routes | `config/routes.rb` |
| Schema | `db/schema.rb` |
| Models | `app/models/*.rb` |
| Services | `app/services/**/*.rb` |
| Views | `app/views/**/*.erb` |
| Frontend | `app/javascript/src/**/*.tsx` |
| Config | `config/application.yml.default` |
| I18n | `config/locales/**/*.yml` |

---

## Next Steps

1. [ ] Finalize framework choice (Next.js vs TanStack Start)
2. [ ] Finalize ORM choice (Drizzle vs Prisma)
3. [ ] Set up new project structure
4. [ ] Begin Phase 1: Database schema generation
5. [ ] Create proof-of-concept for encryption compatibility
