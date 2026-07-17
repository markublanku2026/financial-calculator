import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  id,
  label,
  hint,
  error,
  prefix,
  suffix,
  children,
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const control = children
    ? renderChildControl(children, id, describedBy, Boolean(error))
    : <input id={id} {...inputProps} aria-describedby={describedBy} aria-invalid={error ? 'true' : 'false'} />;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="input-wrap">
        {prefix ? <span className="affix">{prefix}</span> : null}
        {control}
        {suffix ? <span className="affix">{suffix}</span> : null}
      </div>
      {error ? (
        <p className="error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function renderChildControl(
  child: ReactNode,
  id: string,
  describedBy: string | undefined,
  hasError: boolean,
): ReactNode {
  if (!isValidElement(child)) {
    return child;
  }

  return cloneElement(child as ReactElement<SelectHTMLAttributes<HTMLSelectElement>>, {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': hasError ? 'true' : 'false',
  });
}
