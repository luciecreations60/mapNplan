import { Icon } from './Icon.jsx';

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'start',
  className = '',
  type = 'button',
  ...props
}) {
  const iconElement = icon ? <Icon name={icon} size={size === 'small' ? 16 : 18} /> : null;

  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${className}`.trim()}
      {...props}
    >
      {iconPosition === 'start' && iconElement}
      <span>{children}</span>
      {iconPosition === 'end' && iconElement}
    </button>
  );
}
