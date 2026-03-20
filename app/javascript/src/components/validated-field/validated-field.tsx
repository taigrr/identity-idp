import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Children,
  cloneElement,
  createElement,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type {
  ReactNode,
  InputHTMLAttributes,
  ReactHTMLElement,
  ForwardedRef,
} from 'react';

import { useInstanceId } from '@/hooks';
import { t } from '@/i18n';

export type ValidatedFieldValidator = (value: string) => void;

interface ValidatedFieldProps {
  validate?: ValidatedFieldValidator;
  messages?: Record<string, string>;
  children?: ReactNode;
}

export function getErrorMessages(inputType?: string): Partial<Record<keyof ValidityState, string>> {
  const messages: Partial<Record<keyof ValidityState, string>> = {
    valueMissing:
      inputType === 'checkbox'
        ? t('forms.validation.required_checkbox')
        : t('simple_form.required.text'),
  };

  if (inputType === 'email') {
    messages.typeMismatch = t('valid_email.validations.email.invalid');
  }

  return messages;
}

function getNormalizedValidationMessage(
  input: HTMLInputElement | HTMLSelectElement | null,
  errorStrings: Partial<Record<keyof ValidityState, string>>,
): string {
  if (!input || input.validity.valid) {
    return '';
  }

  for (const type in input.validity) {
    const key = type as keyof ValidityState;
    if (key !== 'valid' && input.validity[key] && errorStrings[key]) {
      return errorStrings[key]!;
    }
  }

  return input.validationMessage;
}

function ValidatedField<InputType extends HTMLInputElement | HTMLSelectElement>(
  {
    validate = () => {},
    messages,
    children,
    ...inputProps
  }: ValidatedFieldProps & InputHTMLAttributes<InputType>,
  forwardedRef: ForwardedRef<HTMLInputElement | HTMLSelectElement | null>,
) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  const instanceId = useInstanceId();
  const errorId = `validated-field-error-${instanceId}`;

  const errorStrings = useMemo(
    () => ({ ...getErrorMessages(inputProps.type), ...messages }),
    [inputProps.type, messages],
  );

  useImperativeHandle(forwardedRef, () => inputRef.current!);

  const updateValidState = useCallback((valid: boolean, message = '') => {
    setIsValid(valid);
    setErrorMessage(message);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {return;}

    const originalCheckValidity = input.checkValidity.bind(input);
    const originalReportValidity = input.reportValidity.bind(input);

    input.checkValidity = () => {
      let nextError = '';
      try {
        validate(input.value);
      } catch (error) {
        nextError = (error as Error).message;
      }
      nextError = nextError || (input.validity.customError && input.validationMessage) || '';

      input.setCustomValidity(nextError);
      return !nextError && originalCheckValidity();
    };

    input.reportValidity = () => {
      input.checkValidity();
      return originalReportValidity();
    };

    return () => {
      input.checkValidity = originalCheckValidity;
      input.reportValidity = originalReportValidity;
    };
  }, [validate]);

  const handleInput = useCallback(() => {
    updateValidState(true);
  }, [updateValidState]);

  const handleInvalid = useCallback((event: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    event.preventDefault();
    const input = event.currentTarget;
    const message = getNormalizedValidationMessage(input, errorStrings);
    const valid = !message;

    updateValidState(valid, message);

    if (!valid && !document.activeElement?.classList.contains('usa-input--error')) {
      input.focus();
    }
  }, [errorStrings, updateValidState]);

  const input: ReactHTMLElement<HTMLInputElement | HTMLSelectElement> = children
    ? (Children.only(children) as ReactHTMLElement<InputType>)
    : createElement('input');

  const inputClasses = [
    'validated-field__input',
    !isValid && 'usa-input--error',
    inputProps.className,
    input.props.className,
  ].filter(Boolean).join(' ');

  const describedBy = [
    inputProps['aria-describedby'],
    !isValid && errorId,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="validated-field">
      <div className="validated-field__input-wrapper">
        {cloneElement(input, {
          ...inputProps,
          ref: inputRef,
          'aria-invalid': !isValid,
          'aria-describedby': describedBy,
          className: inputClasses,
          onInput: handleInput,
          onInvalid: handleInvalid,
        })}
        {errorMessage && (
          <div id={errorId} className="usa-error-message">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default forwardRef(ValidatedField);
