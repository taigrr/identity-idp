import { useId } from 'react';

/**
 * Returns a string value guaranteed to be unique to all element instances in the application. This
 * can be used in generic unique IDs when needed in, for example, form input label association.
 *
 * @deprecated Use React's useId() directly instead
 */
function useInstanceId(): string {
  return useId();
}

export default useInstanceId;
