import { useMemo, useState } from 'react';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { createId } from '../../utils/id.js';
import { CHECKLIST_CATEGORIES, getCategoryLabel } from '../../utils/tripWorkspace.js';

export function ChecklistPanel({ trip, onUpdate }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('documents');
  const progress = trip.checklistTotal > 0
    ? (trip.checklistCompleted / trip.checklistTotal) * 100
    : 0;

  const groupedItems = useMemo(() => {
    const groups = new Map();

    trip.checklist.forEach((item) => {
      const currentItems = groups.get(item.category) || [];
      groups.set(item.category, [...currentItems, item]);
    });

    return [...groups.entries()]
      .map(([categoryId, items]) => ({
        id: categoryId,
        label: getCategoryLabel(CHECKLIST_CATEGORIES, categoryId),
        items,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [trip.checklist]);

  function addItem(event) {
    event.preventDefault();
    if (!label.trim()) return;

    onUpdate({
      checklist: [
        ...trip.checklist,
        {
          id: createId('check'),
          label: label.trim(),
          category,
          completed: false,
        },
      ],
    });
    setLabel('');
  }

  function toggleItem(itemId) {
    onUpdate({
      checklist: trip.checklist.map((item) => (
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )),
    });
  }

  function removeItem(itemId) {
    onUpdate({
      checklist: trip.checklist.filter((item) => item.id !== itemId),
    });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">Nothing forgotten</p>
          <h2>Checklist</h2>
          <p>Group preparation tasks by topic and track progress at a glance.</p>
        </div>
      </section>

      <Card className="checklist-progress-card">
        <div>
          <span className="checklist-progress-card__icon"><Icon name="checklist" size={24} /></span>
          <div>
            <span>Preparation progress</span>
            <strong>{trip.checklistCompleted} of {trip.checklistTotal} completed</strong>
          </div>
        </div>
        <div>
          <strong>{Math.round(progress)}%</strong>
          <ProgressBar value={progress} label="Checklist completion" />
        </div>
      </Card>

      <Card className="checklist-add-card">
        <form className="checklist-add-form" onSubmit={addItem}>
          <label>
            <span className="sr-only">New checklist item</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Add a preparation task…" />
          </label>
          <select aria-label="Checklist category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {CHECKLIST_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <Button type="submit" icon="plus">Add</Button>
        </form>
      </Card>

      {groupedItems.length > 0 ? (
        <div className="checklist-groups">
          {groupedItems.map((group) => (
            <Card key={group.id} className="checklist-group">
              <header>
                <div>
                  <h3>{group.label}</h3>
                  <span>{group.items.filter((item) => item.completed).length}/{group.items.length}</span>
                </div>
              </header>
              <div className="checklist-items">
                {group.items.map((item) => (
                  <article key={item.id} className={item.completed ? 'checklist-item checklist-item--completed' : 'checklist-item'}>
                    <button
                      className="checklist-item__toggle"
                      type="button"
                      aria-label={item.completed ? `Mark ${item.label} as incomplete` : `Mark ${item.label} as complete`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Icon name={item.completed ? 'check' : 'circle'} size={17} />
                    </button>
                    <span>{item.label}</span>
                    <button className="icon-button icon-button--small" type="button" aria-label={`Delete ${item.label}`} onClick={() => removeItem(item.id)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <section className="workspace-large-empty">
          <span><Icon name="checklist" size={28} /></span>
          <h3>No preparation tasks yet</h3>
          <p>Add passport checks, bookings, packing and practical reminders above.</p>
        </section>
      )}
    </div>
  );
}
