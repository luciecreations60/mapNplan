export function TextField({
  id,
  label,
  hint,
  error,
  className = '',
  ...inputProps
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`field__input ${error ? 'field__input--error' : ''}`}
        aria-describedby={hint || error ? `${id}-message` : undefined}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {(hint || error) && (
        <small id={`${id}-message`} className={error ? 'field__error' : 'field__hint'}>
          {error || hint}
        </small>
      )}
    </div>
  );
}
