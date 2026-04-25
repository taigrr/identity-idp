/**
 * LexisNexis Configuration
 * Mirrors: app/services/proofing/lexis_nexis/config.rb
 */

export interface LexisNexisConfig {
  instantVerifyWorkflow: string;
  phoneFinderWorkflow?: string;
  accountId: string;
  baseUrl: string;
  username: string;
  password: string;
  hmacKeyId: string;
  hmacSecretKey: string;
  requestMode: string;
  requestTimeout: number;
}

export function createLexisNexisConfig(overrides: Partial<LexisNexisConfig> = {}): LexisNexisConfig {
  return {
    instantVerifyWorkflow: process.env.LEXISNEXIS_INSTANT_VERIFY_WORKFLOW || '',
    phoneFinderWorkflow: process.env.LEXISNEXIS_PHONE_FINDER_WORKFLOW,
    accountId: process.env.LEXISNEXIS_ACCOUNT_ID || '',
    baseUrl: process.env.LEXISNEXIS_BASE_URL || 'https://risk.lexisnexis.com',
    username: process.env.LEXISNEXIS_USERNAME || '',
    password: process.env.LEXISNEXIS_PASSWORD || '',
    hmacKeyId: process.env.LEXISNEXIS_HMAC_KEY_ID || '',
    hmacSecretKey: process.env.LEXISNEXIS_HMAC_SECRET_KEY || '',
    requestMode: process.env.LEXISNEXIS_REQUEST_MODE || 'testing',
    requestTimeout: Number(process.env.LEXISNEXIS_INSTANT_VERIFY_TIMEOUT) || 30,
    ...overrides,
  };
}

/**
 * InstantVerify applicant data for request
 */
export interface InstantVerifyApplicant {
  uuid: string;
  uuidPrefix?: string;
  firstName: string;
  lastName: string;
  ssn: string;
  dob: string; // YYYY-MM-DD format
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipcode: string;
}

/**
 * Check name to attribute mapping for InstantVerify
 */
export const CHECK_NAME_TO_ATTRIBUTE_MAP: Record<string, string> = {
  'Addr1Zip_StateMatch': 'address',
  'SsnFullNameMatch': 'ssn',
  'SsnDeathMatchVerification': 'dead',
  'SSNSSAValid': 'ssn',
  'IdentityOccupancyVerified': 'address',
  'AddrDeliverable': 'address',
  'AddrNotHighRisk': 'address',
  'DOBFullVerified': 'dob',
  'DOBYearVerified': 'dob',
  'LexIDDeathMatch': 'dead',
  'DriversLicense': 'state_id_number',
  'DriversLicenseVerification': 'state_id_number',
};

/**
 * InstantVerify response structures
 */
export interface InstantVerifyResponseBody {
  Status?: {
    ConversationId?: string;
    Reference?: string;
    TransactionReasonCode?: {
      Code?: string;
    };
  };
  Products?: InstantVerifyProduct[];
  [key: string]: unknown;
}

export interface InstantVerifyProduct {
  ProductType: string;
  ProductStatus: string;
  Items?: InstantVerifyItem[];
  [key: string]: unknown;
}

export interface InstantVerifyItem {
  ItemName: string;
  ItemStatus: string;
  [key: string]: unknown;
}

/**
 * Map failed checks to attributes requiring additional verification
 */
export function mapFailedChecksToAttributes(product: InstantVerifyProduct | null): string[] {
  if (!product?.Items) {
    return [];
  }

  const failedAttributes = new Set<string>();

  for (const item of product.Items) {
    if (item.ItemStatus === 'pass') {
      continue;
    }

    const attribute = CHECK_NAME_TO_ATTRIBUTE_MAP[item.ItemName];
    if (attribute) {
      failedAttributes.add(attribute);
    } else {
      failedAttributes.add('unknown');
    }
  }

  return [...failedAttributes].sort();
}
