# Rails to Next.js Migration Status

## Summary

| Metric | Value |
|--------|-------|
| Next.js modules | 145+ files |
| Next.js tests | **619 passing** |
| Test files | 40 |
| TypeScript errors | 0 |
| Rails services (total) | 362 files |
| **Rails services with Next.js parity** | ~130 files (36%) |

## Quick Start: Testing Next.js Routes

### 1. Start Next.js in development
```bash
cd next-app
npm run dev  # Starts on port 3001
```

### 2. Enable Rails proxy (optional)
```bash
# Set environment variables before starting Rails
export NEXT_JS_PROXY_ENABLED=true
export NEXT_JS_URL=http://localhost:3001

# Or add to .env.development.local
rails server
```

### 3. Test the routes directly
```bash
# Test Next.js directly
curl http://localhost:3001/api/country-support
curl http://localhost:3001/api/openid-connect/certs
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/database

# Test through Rails proxy (if enabled)
curl http://localhost:3000/api/country-support
```

## Active Migration Routes

| Route | Rails Controller | Next.js Route | Status |
|-------|-----------------|---------------|--------|
| `GET /api/country-support` | `CountrySupportController` | `src/app/api/country-support/route.ts` | ✅ Ready |
| `GET /api/openid-connect/certs` | `OpenidConnect::CertsController` | `src/app/api/openid-connect/certs/route.ts` | ✅ Ready |
| `GET /api/health` | `Health::HealthController` | `src/app/api/health/route.ts` | ✅ Ready |
| `GET /api/health/database` | `Health::DatabaseController` | `src/app/api/health/database/route.ts` | ✅ Ready |
| `POST /api/openid-connect/token` | `OpenidConnect::TokenController` | `src/app/api/openid-connect/token/route.ts` | ⏳ DB Wiring |
| `GET /api/openid-connect/userinfo` | `OpenidConnect::UserInfoController` | `src/app/api/openid-connect/userinfo/route.ts` | ⏳ DB Wiring |

## Proxy Configuration

The `NextJsProxy` middleware (`lib/next_js_proxy.rb`) enables gradual migration:

| Env Variable | Description | Default |
|--------------|-------------|---------|
| `NEXT_JS_PROXY_ENABLED` | Enable/disable proxying | `false` |
| `NEXT_JS_URL` | Next.js app URL | `http://localhost:3001` |
| `NEXT_JS_PROXY_ROUTES` | Comma-separated routes to proxy | `/api/country-support,/api/openid-connect/certs,/api/health,/api/health/database` |

## Migration Strategy

Rails services **cannot be deleted** until their corresponding Next.js routes are live and handling traffic. The services below have 1:1 TypeScript implementations ready, but remain in Rails because Rails controllers/forms still depend on them.

## Services with 1:1 Parity (Ready for Route Cutover)

### Encryption (`src/lib/encryption/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/encryption/aes_cipher.rb` | `aes-cipher.ts` | ✅ Parity |
| `app/services/encryption/aes_cipher_v2.rb` | `aes-cipher.ts` | ✅ Parity |
| `app/services/encryption/kms_client.rb` | `kms-client.ts` | ✅ Parity |
| `app/services/encryption/password_verifier.rb` | `password-verifier.ts` (in auth/) | ✅ Parity |
| `app/services/encryption/encodable.rb` | `encoding.ts` | ✅ Parity |

**Blocked by**: `PiiEncryptor`, `AttributeEncryptor`, `AesEncryptor` still use these

### Auth (`src/lib/auth/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/remember_device_cookie.rb` | `remember-device.ts` | ✅ Parity |
| `app/services/email_normalizer.rb` | `email-normalizer.ts` | ✅ Parity |
| `app/services/encryption/password_verifier.rb` | `password-verifier.ts` | ✅ Parity |

**Blocked by**: `RememberDeviceConcern`, `RegisterUserEmailForm`, models

### MFA (`src/lib/mfa/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/backup_code_generator.rb` | `backup-codes.ts` | ✅ Parity |
| TOTP logic in models | `totp.ts` | ✅ Parity |
| WebAuthn logic in lib | `webauthn.ts` | ✅ Parity |

**Blocked by**: Controllers still use Rails services

### Personal Key (`src/lib/personal-key/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/personal_key_generator.rb` | `index.ts` | ✅ Parity |
| `app/services/random_phrase.rb` | `index.ts` | ✅ Parity |
| `app/services/profanity_detector.rb` | `index.ts` | ✅ Parity |

**Blocked by**: `Profile` model, `PersonalKeyVerificationController`

### Rate Limiter (`src/lib/rate-limiter/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/rate_limiter.rb` | `rate-limiter.ts` | ✅ Parity |
| `app/services/redis_rate_limiter.rb` | `redis-rate-limiter.ts` | ✅ Parity |
| `app/services/otp_rate_limiter.rb` | `rate-limiter.ts` | ✅ Parity |

**Blocked by**: ~20 controllers/forms use RateLimiter

### OIDC (`src/lib/oidc/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/id_token_builder.rb` | `id-token.ts` | ✅ Parity |
| `app/services/access_token_verifier.rb` | `access-token-verifier.ts` | ✅ Parity |
| `app/services/identity_linker.rb` | `identity-linker.ts` | ✅ Parity |
| `app/services/agency_identity_linker.rb` | `identity-linker.ts` | ✅ Parity |
| `app/services/authn_context_resolver.rb` | `authn-context-resolver.ts` | ✅ Parity |

**Blocked by**: OIDC controllers still in Rails

### Phone (`src/lib/phone/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/phone_number_capabilities.rb` | `capabilities.ts` | ✅ Parity |

**Blocked by**: Phone verification flows in Rails

### Telephony (`src/lib/telephony/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `lib/telephony/pinpoint/sms_sender.rb` | `sms-sender.ts` | ✅ Parity |
| `lib/telephony/pinpoint/voice_sender.rb` | `voice-sender.ts` | ✅ Parity |
| `lib/telephony/otp_sender.rb` | `otp-sender.ts` | ✅ Parity |

**Blocked by**: OTP flows in Rails

### Doc Auth (`src/lib/doc-auth/`)

| Rails Directory | Next.js Directory | Status |
|-----------------|-------------------|--------|
| `app/services/doc_auth/lexis_nexis/` | `lexis-nexis/` | ✅ Parity |
| `app/services/doc_auth/socure/` | `socure/` | ✅ Parity |
| `app/services/doc_auth/mock/` | `mock/` | ✅ Parity |

**Blocked by**: Doc capture controllers in Rails

### Proofing (`src/lib/proofing/`)

| Rails Directory | Next.js Directory | Status |
|-----------------|-------------------|--------|
| `app/services/proofing/aamva/` | `aamva/` | ✅ Parity |
| `app/services/proofing/lexis_nexis/` | `lexis-nexis/` | ✅ Parity |
| `app/services/proofing/socure/` | `socure/` | ✅ Parity |
| `app/services/proofing/resolution/` | `resolution/` | ✅ Parity |

**Blocked by**: IDV flows in Rails

### IDV (`src/lib/idv/`)

| Rails File | Next.js File | Status |
|------------|--------------|--------|
| `app/services/idv/session.rb` | `session.ts` | ✅ Parity |
| `app/services/idv/agent.rb` | `agent.ts` | ✅ Parity |
| `app/services/idv/profile_maker.rb` | `profile-maker.ts` | ✅ Parity |
| `app/services/idv/duplicate_ssn_finder.rb` | `duplicate-ssn-finder.ts` | ✅ Parity |
| `app/services/duplicate_profile_checker.rb` | `duplicate-ssn-finder.ts` | ✅ Parity |

**Blocked by**: IDV step controllers in Rails

### Other Services

| Rails Directory | Next.js Directory | Status |
|-----------------|-------------------|--------|
| `app/services/account_reset/` | `account-reset/` | ✅ Parity |
| `app/services/event_disavowal/` | `event-disavowal/` | ✅ Parity |
| `app/services/push_notification/` | `push-notification/` | ✅ Parity |
| `app/services/user_alerts/` | `user-alerts/` | ✅ Parity |
| `app/services/pii/` | `pii/` | ✅ Parity |
| `app/services/pwned_passwords/` | `pwned-passwords/` | ✅ Parity |

## Services Staying in Rails (Intentionally)

| Category | Reason |
|----------|--------|
| **SAML IdP** | Complex XML signing, `saml_idp` gem, federal compliance |
| **PIV/CAC** | Hardware tokens, X.509 certificate parsing |
| **GPO Mail** | Physical mail, FTP uploads, USPS integration |
| **USPS In-Person** | Appointment scheduling, physical locations |
| **X.509 Certificate** | Certificate handling, PIV authentication |
| **Admin/Reporting** | Dashboard, reports, admin-only functionality |
| **Fraud Ops** | Manual review workflows |
| **Background Jobs** | Rails-specific GoodJob infrastructure |

## Route Migration Checklist

When migrating a route from Rails to Next.js:

1. [ ] Verify Next.js implementation handles all edge cases
2. [ ] Add feature flag to toggle between Rails/Next.js
3. [ ] Deploy Next.js route behind flag
4. [ ] Test in staging with real traffic
5. [ ] Gradually roll out to production
6. [ ] Monitor error rates and performance
7. [ ] Once 100% on Next.js, mark Rails service as deprecated
8. [ ] After deprecation period, delete Rails service

## Files Safe to Delete After Route Cutover

Once a Next.js route is handling 100% of traffic for a feature, these Rails files can be deleted:

### After OIDC Routes Migrate
```
app/services/id_token_builder.rb
app/services/access_token_verifier.rb
app/services/identity_linker.rb
app/services/agency_identity_linker.rb
app/services/authn_context_resolver.rb
```

### After Auth Routes Migrate
```
app/services/remember_device_cookie.rb
app/services/email_normalizer.rb
app/services/encryption/password_verifier.rb
```

### After MFA Routes Migrate
```
app/services/backup_code_generator.rb
```

### After IDV Routes Migrate
```
app/services/idv/agent.rb
app/services/idv/session.rb
app/services/idv/profile_maker.rb
app/services/idv/duplicate_ssn_finder.rb
app/services/duplicate_profile_checker.rb
app/services/doc_auth/ (entire directory)
app/services/proofing/ (entire directory)
```

### After Rate Limiting Moves to Next.js Middleware
```
app/services/rate_limiter.rb
app/services/redis_rate_limiter.rb
app/services/otp_rate_limiter.rb
```

## Current Blockers

All Rails services are still **actively used** by Rails controllers, forms, and models. To prune:

1. Migrate corresponding Rails routes to Next.js
2. Update Rails to call Next.js API (or remove Rails route entirely)
3. Delete Rails service after verification period
