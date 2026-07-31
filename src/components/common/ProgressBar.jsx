export function ProgressBar({ value = 0, label = 'Progress', tone = 'primary' }) {
  const normalizedValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="progress" aria-label={label}>
      <div className="progress__track">
        <span
          className={`progress__value progress__value--${tone}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      <span className="sr-only">{Math.round(normalizedValue)}%</span>
    </div>
  );
}
