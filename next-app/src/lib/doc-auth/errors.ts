/**
 * DocAuth errors - mirrors Ruby's DocAuth::Errors module
 * @see app/services/doc_auth/errors.rb
 */

export const DocAuthErrors = {
  // HTTP Status Codes
  IMAGE_LOAD_FAILURE: 'image_load_failure',
  IMAGE_LOAD_FAILURE_FIELD: 'image_load_failure_field',
  PIXEL_DEPTH_FAILURE: 'pixel_depth_failure',
  PIXEL_DEPTH_FAILURE_FIELD: 'pixel_depth_failure_field',
  IMAGE_SIZE_FAILURE: 'image_size_failure',
  IMAGE_SIZE_FAILURE_FIELD: 'image_size_failure_field',

  // Network
  NETWORK: 'network',

  // Alerts
  BARCODE_CONTENT_CHECK: 'barcode_content_check',
  BARCODE_READ_CHECK: 'barcode_read_check',
  BIRTH_DATE_CHECKS: 'birth_date_checks',
  CONTROL_NUMBER_CHECK: 'control_number_check',
  DOC_CROSSCHECK: 'doc_crosscheck',
  DOC_NUMBER_CHECKS: 'doc_number_checks',
  DOCUMENT_EXPIRED_CHECK: 'doc_expired_check',
  EXPIRATION_CHECKS: 'expiration_checks',
  FULL_NAME_CHECK: 'full_name_check',
  GENERAL_ERROR: 'general_error',
  ID_NOT_RECOGNIZED: 'id_not_recognized',
  ID_NOT_VERIFIED: 'id_not_verified',
  ISSUE_DATE_CHECKS: 'issue_date_checks',
  MULTIPLE_BACK_ID_FAILURES: 'multiple_back_id_failures',
  MULTIPLE_FRONT_ID_FAILURES: 'multiple_front_id_failures',
  REF_CONTROL_NUMBER_CHECK: 'ref_control_number_check',
  SELFIE_FAILURE: 'selfie_failure',
  SELFIE_NOT_LIVE_OR_POOR_QUALITY: 'selfie_not_live_or_poor_quality',
  SEX_CHECK: 'sex_check',
  VISIBLE_COLOR_CHECK: 'visible_color_check',
  VISIBLE_PHOTO_CHECK: 'visible_photo_check',

  // Image metrics
  DPI_LOW: 'dpi_low',
  DPI_LOW_FIELD: 'dpi_low_field',
  DPI_LOW_ONE_SIDE: 'dpi_low_one_side',
  DPI_LOW_BOTH_SIDES: 'dpi_low_both_sides',
  SHARP_LOW: 'sharp_low',
  SHARP_LOW_FIELD: 'sharp_low_field',
  SHARP_LOW_ONE_SIDE: 'sharp_low_one_side',
  SHARP_LOW_BOTH_SIDES: 'sharp_low_both_sides',
  GLARE_LOW: 'glare_low',
  GLARE_LOW_FIELD: 'glare_low_field',
  GLARE_LOW_ONE_SIDE: 'glare_low_one_side',
  GLARE_LOW_BOTH_SIDES: 'glare_low_both_sides',

  // Doc type
  DOC_TYPE_CHECK: 'doc_type_check',
  CARD_TYPE: 'card_type',

  // Other
  FALLBACK_FIELD_LEVEL: 'fallback_field_level',
} as const;

export type DocAuthError = (typeof DocAuthErrors)[keyof typeof DocAuthErrors];

export const ALL_DOC_AUTH_ERRORS: DocAuthError[] = [
  DocAuthErrors.BARCODE_CONTENT_CHECK,
  DocAuthErrors.BARCODE_READ_CHECK,
  DocAuthErrors.BIRTH_DATE_CHECKS,
  DocAuthErrors.CONTROL_NUMBER_CHECK,
  DocAuthErrors.DOC_CROSSCHECK,
  DocAuthErrors.DOC_NUMBER_CHECKS,
  DocAuthErrors.DOC_TYPE_CHECK,
  DocAuthErrors.EXPIRATION_CHECKS,
  DocAuthErrors.FULL_NAME_CHECK,
  DocAuthErrors.GENERAL_ERROR,
  DocAuthErrors.ID_NOT_RECOGNIZED,
  DocAuthErrors.ID_NOT_VERIFIED,
  DocAuthErrors.ISSUE_DATE_CHECKS,
  DocAuthErrors.MULTIPLE_BACK_ID_FAILURES,
  DocAuthErrors.MULTIPLE_FRONT_ID_FAILURES,
  DocAuthErrors.REF_CONTROL_NUMBER_CHECK,
  DocAuthErrors.SELFIE_FAILURE,
  DocAuthErrors.SEX_CHECK,
  DocAuthErrors.VISIBLE_COLOR_CHECK,
  DocAuthErrors.VISIBLE_PHOTO_CHECK,
  DocAuthErrors.DPI_LOW,
  DocAuthErrors.DPI_LOW_ONE_SIDE,
  DocAuthErrors.DPI_LOW_BOTH_SIDES,
  DocAuthErrors.SHARP_LOW,
  DocAuthErrors.SHARP_LOW_ONE_SIDE,
  DocAuthErrors.SHARP_LOW_BOTH_SIDES,
  DocAuthErrors.GLARE_LOW,
  DocAuthErrors.GLARE_LOW_ONE_SIDE,
  DocAuthErrors.GLARE_LOW_BOTH_SIDES,
  DocAuthErrors.FALLBACK_FIELD_LEVEL,
];

export interface UserDisplayError {
  longMsg: string;
  longMsgPlural?: string;
  fieldMsg: string;
  hints?: boolean;
}

export const USER_DISPLAY_ERRORS: Record<string, UserDisplayError> = {
  // HTTP status
  [DocAuthErrors.IMAGE_LOAD_FAILURE]: {
    longMsg: DocAuthErrors.IMAGE_LOAD_FAILURE,
    longMsgPlural: DocAuthErrors.IMAGE_LOAD_FAILURE,
    fieldMsg: DocAuthErrors.IMAGE_LOAD_FAILURE_FIELD,
  },
  [DocAuthErrors.PIXEL_DEPTH_FAILURE]: {
    longMsg: DocAuthErrors.PIXEL_DEPTH_FAILURE,
    longMsgPlural: DocAuthErrors.PIXEL_DEPTH_FAILURE,
    fieldMsg: DocAuthErrors.PIXEL_DEPTH_FAILURE_FIELD,
  },
  [DocAuthErrors.IMAGE_SIZE_FAILURE]: {
    longMsg: DocAuthErrors.IMAGE_SIZE_FAILURE,
    longMsgPlural: DocAuthErrors.IMAGE_SIZE_FAILURE,
    fieldMsg: DocAuthErrors.IMAGE_SIZE_FAILURE_FIELD,
  },

  // Image metrics
  [DocAuthErrors.DPI_LOW]: {
    longMsg: DocAuthErrors.DPI_LOW_ONE_SIDE,
    longMsgPlural: DocAuthErrors.DPI_LOW_BOTH_SIDES,
    fieldMsg: DocAuthErrors.DPI_LOW_FIELD,
  },
  [DocAuthErrors.SHARP_LOW]: {
    longMsg: DocAuthErrors.SHARP_LOW_ONE_SIDE,
    longMsgPlural: DocAuthErrors.SHARP_LOW_BOTH_SIDES,
    fieldMsg: DocAuthErrors.SHARP_LOW_FIELD,
  },
  [DocAuthErrors.GLARE_LOW]: {
    longMsg: DocAuthErrors.GLARE_LOW_ONE_SIDE,
    longMsgPlural: DocAuthErrors.GLARE_LOW_BOTH_SIDES,
    fieldMsg: DocAuthErrors.GLARE_LOW_FIELD,
  },

  // Alerts
  [DocAuthErrors.REF_CONTROL_NUMBER_CHECK]: {
    longMsg: DocAuthErrors.REF_CONTROL_NUMBER_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.BARCODE_CONTENT_CHECK]: {
    longMsg: DocAuthErrors.BARCODE_CONTENT_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.BARCODE_READ_CHECK]: {
    longMsg: DocAuthErrors.BARCODE_READ_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.BIRTH_DATE_CHECKS]: {
    longMsg: DocAuthErrors.BIRTH_DATE_CHECKS,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.CONTROL_NUMBER_CHECK]: {
    longMsg: DocAuthErrors.CONTROL_NUMBER_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.ID_NOT_RECOGNIZED]: {
    longMsg: DocAuthErrors.ID_NOT_RECOGNIZED,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.DOC_CROSSCHECK]: {
    longMsg: DocAuthErrors.DOC_CROSSCHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.DOCUMENT_EXPIRED_CHECK]: {
    longMsg: DocAuthErrors.DOCUMENT_EXPIRED_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.DOC_NUMBER_CHECKS]: {
    longMsg: DocAuthErrors.DOC_NUMBER_CHECKS,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.DOC_TYPE_CHECK]: {
    longMsg: DocAuthErrors.DOC_TYPE_CHECK,
    fieldMsg: DocAuthErrors.CARD_TYPE,
    hints: true,
  },
  [DocAuthErrors.EXPIRATION_CHECKS]: {
    longMsg: DocAuthErrors.EXPIRATION_CHECKS,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.FULL_NAME_CHECK]: {
    longMsg: DocAuthErrors.FULL_NAME_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.ISSUE_DATE_CHECKS]: {
    longMsg: DocAuthErrors.ISSUE_DATE_CHECKS,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.ID_NOT_VERIFIED]: {
    longMsg: DocAuthErrors.ID_NOT_VERIFIED,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.VISIBLE_PHOTO_CHECK]: {
    longMsg: DocAuthErrors.VISIBLE_PHOTO_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.SEX_CHECK]: {
    longMsg: DocAuthErrors.SEX_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.VISIBLE_COLOR_CHECK]: {
    longMsg: DocAuthErrors.VISIBLE_COLOR_CHECK,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },

  // Multiple errors
  [DocAuthErrors.MULTIPLE_FRONT_ID_FAILURES]: {
    longMsg: DocAuthErrors.MULTIPLE_FRONT_ID_FAILURES,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.MULTIPLE_BACK_ID_FAILURES]: {
    longMsg: DocAuthErrors.MULTIPLE_BACK_ID_FAILURES,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },
  [DocAuthErrors.GENERAL_ERROR]: {
    longMsg: DocAuthErrors.GENERAL_ERROR,
    fieldMsg: DocAuthErrors.FALLBACK_FIELD_LEVEL,
    hints: true,
  },

  // Selfie errors
  [DocAuthErrors.SELFIE_FAILURE]: {
    longMsg: DocAuthErrors.SELFIE_FAILURE,
    fieldMsg: DocAuthErrors.SELFIE_FAILURE,
    hints: false,
  },
  [DocAuthErrors.SELFIE_NOT_LIVE_OR_POOR_QUALITY]: {
    longMsg: DocAuthErrors.SELFIE_NOT_LIVE_OR_POOR_QUALITY,
    fieldMsg: DocAuthErrors.SELFIE_FAILURE,
    hints: false,
  },
};
