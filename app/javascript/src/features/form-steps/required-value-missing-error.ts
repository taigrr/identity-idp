import { t } from '@/i18n';

import FormError from './form-error';

/**
 * An error representing a state where a required form value is missing.
 */
class RequiredValueMissingError extends FormError {
  message = t('simple_form.required.text');
}

export default RequiredValueMissingError;
