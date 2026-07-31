import { useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { Icon } from './Icon.jsx';

export function Modal({ isOpen, title, description, children, onClose }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('modal-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-describedby={description ? 'modal-description' : undefined}
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <p className="eyebrow">{t('modal.eyebrow')}</p>
            <h2 id="modal-title">{title}</h2>
            {description && <p id="modal-description">{description}</p>}
          </div>
          <button className="icon-button" type="button" aria-label={t('common.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
