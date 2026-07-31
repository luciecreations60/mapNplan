import { useEffect, useState } from 'react';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';

export function NotesPanel({ trip, onUpdate }) {
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
        <div>
          <p className="eyebrow">Flexible space</p>
          <h2>Travel notes</h2>
          <p>Keep useful context that does not belong to a specific activity or expense.</p>
        </div>
        <Button icon="save" disabled={status === 'saved'} onClick={saveNotes}>
          {status === 'saved' ? 'Saved' : 'Save notes'}
        </Button>
      </section>

      <div className="notes-layout">
        <Card className="notes-editor-card">
          <textarea
            value={notes}
            onChange={updateNotes}
            placeholder="Ideas, addresses, booking references, local phrases, restaurant wishes…"
            aria-label="Travel notes"
          />
          <footer>
            <span>{notes.length} characters</span>
            <span className={status === 'saved' ? 'notes-status notes-status--saved' : 'notes-status'}>
              <Icon name={status === 'saved' ? 'checkCircle' : 'edit'} size={15} />
              {status === 'saved' ? 'All changes saved' : 'Unsaved changes'}
            </span>
          </footer>
        </Card>

        <Card className="notes-tips-card">
          <span><Icon name="sparkles" size={24} /></span>
          <h3>Useful things to keep here</h3>
          <ul>
            <li>Emergency contacts and insurance details</li>
            <li>Booking references and access instructions</li>
            <li>Local words, etiquette and cultural reminders</li>
            <li>Restaurants and places to decide later</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
