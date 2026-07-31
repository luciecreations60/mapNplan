
import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { Button } from '../common/Button.jsx';
import { Icon } from '../common/Icon.jsx';

/**
 * Reusable local discussion attached to an itinerary activity or reservation.
 * The parent owns persistence so this component stays presentation-focused.
 */
export function DiscussionThread({ comments = [], currentUserName, onAdd, onRemove }) {
  const { locale, t } = useI18n();
  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  function submitComment(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    onAdd(trimmedMessage);
    setMessage('');
    setOpen(true);
  }

  return (
    <section className="discussion-thread">
      <button className="discussion-thread__toggle" type="button" onClick={() => setOpen((current) => !current)}>
        <Icon name="message" size={16} />
        <span>{t(comments.length === 1 ? 'discussion.commentCountOne' : 'discussion.commentCountMany', { count: comments.length })}</span>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={16} />
      </button>

      {isOpen && (
        <div className="discussion-thread__body">
          {comments.length > 0 ? (
            <div className="discussion-thread__list">
              {comments.map((comment) => (
                <article key={comment.id} className="discussion-comment">
                  <span className="discussion-comment__avatar">{getInitials(comment.authorName)}</span>
                  <div>
                    <header>
                      <strong>{comment.authorName}</strong>
                      <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt, locale)}</time>
                    </header>
                    <p>{comment.message}</p>
                  </div>
                  {comment.authorName === currentUserName && (
                    <button
                      className="icon-button icon-button--small"
                      type="button"
                      aria-label={t('discussion.deleteComment')}
                      onClick={() => onRemove(comment.id)}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="discussion-thread__empty">{t('discussion.empty')}</p>
          )}

          <form className="discussion-thread__form" onSubmit={submitComment}>
            <label>
              <span className="sr-only">{t('discussion.placeholder')}</span>
              <textarea
                rows="2"
                value={message}
                maxLength="500"
                placeholder={t('discussion.placeholder')}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <Button type="submit" size="small" icon="send" disabled={!message.trim()}>
              {t('discussion.send')}
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}

function getInitials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatCommentDate(value, locale) {
  if (!value) return '';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
