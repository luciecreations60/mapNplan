import { useEffect, useId, useRef } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { Icon } from './Icon.jsx';

export function Modal({ isOpen, title, description, children, onClose, size = 'default' }) {
  const { t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({ active: isOpen, containerRef: modalRef, initialFocusRef: closeButtonRef });

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
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
        ref={modalRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal${size === 'large' ? ' modal--large' : ''}`}
        role="dialog"
        tabIndex="-1"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <p className="eyebrow">{t('modal.eyebrow')}</p>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button ref={closeButtonRef} className="icon-button" type="button" aria-label={t('common.close')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
