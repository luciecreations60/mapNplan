import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';

export function NotesPanel({ trip, onUpdate }) {
  const { t } = useI18n();
  const [notes, setNotes] = useState(trip.notes || '');
  const [status, setStatus] = useState('saved');

  useEffect(() => {
    setNotes(trip.notes || '');
    setStatus('saved');
  }, [trip.id, trip.notes]);

  function updateNotes(event) {
    setNotes(event.target.value);
    setStatus('edited');
  }

  function saveNotes() {
    onUpdate({ notes });
    setStatus('saved');
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div><p className="eyebrow">{t('notes.eyebrow')}</p><h2>{t('notes.title')}</h2><p>{t('notes.intro')}</p></div>
        <Button icon="save" disabled={status === 'saved'} onClick={saveNotes}>
          {status === 'saved' ? t('notes.saved') : t('notes.saveNotes')}
        </Button>
      </section>

      <div className="notes-layout">
        <Card className="notes-editor-card">
          <textarea value={notes} onChange={updateNotes} placeholder={t('notes.placeholder')} aria-label={t('notes.aria')} />
          <footer>
            <span>{t('notes.characters', { count: notes.length })}</span>
            <span className={status === 'saved' ? 'notes-status notes-status--saved' : 'notes-status'}>
              <Icon name={status === 'saved' ? 'checkCircle' : 'edit'} size={15} />
              {status === 'saved' ? t('notes.allSaved') : t('notes.unsaved')}
            </span>
          </footer>
        </Card>

        <Card className="notes-tips-card">
          <span><Icon name="sparkles" size={24} /></span>
          <h3>{t('notes.tips')}</h3>
          <ul><li>{t('notes.tip1')}</li><li>{t('notes.tip2')}</li><li>{t('notes.tip3')}</li><li>{t('notes.tip4')}</li></ul>
        </Card>
      </div>
    </div>
  );
}
