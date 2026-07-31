import { Icon } from '../common/Icon.jsx';

export function InlineNotice({ tone = 'neutral', title, children, className = '' }) {
  const iconName = tone === 'success'
    ? 'checkCircle'
    : tone === 'danger'
      ? 'alertCircle'
      : tone === 'warning'
        ? 'alertTriangle'
        : 'info';

  return (
    <div className={`inline-notice inline-notice--${tone} ${className}`.trim()} role={tone === 'danger' ? 'alert' : 'status'}>
      <span><Icon name={iconName} size={19} /></span>
      <div>
        {title && <strong>{title}</strong>}
        <p>{children}</p>
      </div>
    </div>
  );
}
