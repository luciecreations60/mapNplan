import { Button } from './Button.jsx';
import { Modal } from './Modal.jsx';

/**
 * Generic confirmation dialog used before destructive or reversible actions.
 * The caller owns the open state and the action implementation.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  return (
    <Modal isOpen={isOpen} title={title} description={description} onClose={onClose}>
      <footer className="modal__footer modal__footer--standalone">
        <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );
}
