# Vendor Comparison

## Provider Capabilities

| Capability | LexisNexis | Socure | Stripe Identity | AAMVA | Dept. of State | USPS |
| --- | --- | --- | --- | --- | --- | --- |
| **Document Authentication** | TrueID: 6,800+ ID types from 200+ countries, 50+ forensic tests, OCR, barcode/MRZ parsing | Predictive DocV: ID authentication with OCR extraction | Document verification for 120+ countries, AI + heuristic analysis + manual review, barcode/MRZ decoding | — | — | — |
| **Selfie / Liveness** | TrueID: passive liveness + facial matching; IDVerse: active liveness, deepfake detection, 99.998% biometric accuracy | Selfie match included in DocV | Face similarity check, liveness detection (live vs photo/screen), duplicate selfie detection | — | — | — |
| **Identity Resolution (KYC)** | InstantVerify: name, address, phone, SSN, DOB against 10,000+ data sources; covers ~100% US adults | Socure Verify (KYC): up to 98% auto-approval; eCBSV: SSN+name+DOB against SSA records | ID number verification against credit agencies / gov databases; SSN (last 4) in US | — | — | — |
| **Address Verification** | InstantVerify: flags high-risk/mail-drop addresses; PhoneFinder: phone-to-address linking; Best Address: USPS COA integration | Address Risk: deliverability, tenure, property type, alternative address links | Name + DOB + address against credit/utility/gov databases (30+ countries, invite-only) | — | — | — |
| **State ID / Driver License Verification** | — | — | — | DLDV: real-time verification of name, DOB, license #, expiration, issue date against issuing DMV; 44 jurisdictions (~73% US population) | — | — |
| **Device Profiling / Fraud** | ThreatMetrix: device fingerprinting, behavioral analytics, bot/malware/ATO detection, cross-industry network | Digital Intelligence: device + behavioral risk signals; Sigma Fraud suite (first-party, identity, synthetic) | Built-in fraud signals: device fingerprinting, IP, network activity history, fraud score via AI models | — | — | — |
| **Phone Risk / Verification** | PhoneFinder: phone-to-identity linking, line type, porting/spoofing detection, Caller ID; 3 tiers | Phone Risk: porting history, subscriber tenure, line type | Phone number + SMS verification against Stripe network signals (US only, invite-only) | — | — | — |
| **Passport MRZ Validation** | TrueID: MRZ parsing as part of doc auth | — | Passport support in doc verification | — | MRZ validation against Dept. of State records | — |
| **Email Risk** | — | Email Risk: email-to-identity correlation + risk scoring | — | — | — | — |
| **Watchlist / Sanctions** | — | Global Watchlist Screening with Monitoring | — | — | — | — |
| **Mail Verification** | — | — | — | — | — | GPO letter with verification code |

## Pricing Comparison (estimated per verification)

All prices normalized to cost per single verification/transaction in USD. LexisNexis and Socure do not publish rates; estimates below are based on industry benchmarks, government procurement patterns, and comparable vendor pricing. Actual rates depend heavily on contract volume.

| Capability | LexisNexis | Socure | Stripe Identity | AAMVA | Dept. of State | USPS |
| --- | --- | --- | --- | --- | --- | --- |
| **Document Authentication** | ~$2.00–4.00 (TrueID) | ~$2.00–3.50 (DocV) | **$1.50** | — | — | — |
| **Selfie / Liveness** | included w/ TrueID | included w/ DocV | included w/ doc check | — | — | — |
| **Identity Resolution (KYC)** | ~$0.50–1.50 (InstantVerify) | ~$0.50–1.50 (KYC) | **$0.50** | — | — | — |
| **Address Verification** | ~$0.25–0.75 | ~$0.10–0.50 | invite-only (unpublished) | — | — | — |
| **State ID / DL Verification** | — | — | — | ~$0.50–1.00 | — | — |
| **Device Profiling / Fraud** | ~$0.05–0.15 (ThreatMetrix) | ~$0.05–0.20 (Digital Intel) | included w/ doc check | — | — | — |
| **Phone Risk / Verification** | ~$0.25–0.75 (PhoneFinder) | ~$0.10–0.50 (Phone Risk) | invite-only (unpublished) | — | — | — |
| **Passport MRZ Validation** | included w/ TrueID | — | included w/ doc check | — | gov-to-gov (no per-txn fee) | — |
| **Email Risk** | — | ~$0.05–0.15 | — | — | — | — |
| **Watchlist / Sanctions** | — | ~$0.10–0.30 | — | — | — | — |
| **Mail Verification** | — | — | — | — | — | ~$0.78 (postage) |
|  |  |  |  |  |  |  |
| **Estimated full-stack IDV cost** | **~$3.00–7.00** | **~$3.00–6.00** | **~$2.00** | **~$0.50–1.00** | — | **~$0.78** |
| **Pricing model** | Enterprise contract, per-txn | Enterprise contract, per-txn + annual | Pay-as-you-go, per-txn | Per-txn | Gov-to-gov | Per letter |
| **Volume discounts** | Yes (negotiated) | Yes (negotiated) | Yes (2,000+/mo → custom) | Varies by state | — | Bulk mail rates |
| **Free tier** | No | No | First 50 free | No | — | No |

> **Note:** LexisNexis and Socure estimates are rough ranges based on industry norms for enterprise identity verification vendors at moderate volume (10k–100k txns/month). Actual contracted rates may fall outside these ranges. Stripe is the only vendor with fully transparent public pricing.

## Pipeline Steps → Integrated Providers

| Step | Config / Routing | Current Default | Alternatives |
| --- | --- | --- | --- |
| 1. Document Auth | `doc_auth_vendor_default` / AB `:DOC_AUTH_VENDOR` | LexisNexis TrueID | LexisNexis DDP, Socure DocV, Stripe Identity |
| 2. Device Profiling | `proofing_device_profiling` + `ThreatMetrixPlugin` | LexisNexis ThreatMetrix | Stripe (built-in), disabled |
| 3. Residential Address Resolution | `ResidentialAddressPlugin` (IPP only) | LexisNexis InstantVerify | LexisNexis DDP, Socure KYC |
| 4. State ID Address Resolution | `StateIdAddressPlugin` | LexisNexis InstantVerify | LexisNexis DDP, Socure KYC |
| 5. State ID Verification | `AamvaPlugin` | AAMVA | skipped for passports / unsupported jurisdictions |
| 6. Phone Verification | `PhonePlugin` → `AddressProofer` | LexisNexis PhoneFinder | LexisNexis DDP PhoneFinder, Socure PhoneRisk |
| 7. Passport MRZ | `DocAuth::Dos::MrzRequest` | Dept. of State | — |
| 8. Mail Verification | `GpoConfirmationMaker` | USPS / GPO | — |
