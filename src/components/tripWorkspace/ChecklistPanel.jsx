import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { createId } from '../../utils/id.js';
import { CHECKLIST_CATEGORIES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function ChecklistPanel({ trip, onUpdate }) {
  const { t } = useI18n();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('documents');
  const [customListTitle, setCustomListTitle] = useState('');
  const [showCustomList, setShowCustomList] = useState(false);
  const progress = trip.checklistTotal > 0 ? (trip.checklistCompleted / trip.checklistTotal) * 100 : 0;

  const groupedItems = useMemo(() => {
    const groups = new Map();
    trip.checklist.forEach((item) => {
      const groupId = item.listTitle ? `custom:${item.listTitle}` : item.category;
      const currentItems = groups.get(groupId) || [];
      groups.set(groupId, [...currentItems, item]);
    });

    return [...groups.entries()]
      .map(([categoryId, items]) => ({
        id: categoryId,
        label: categoryId.startsWith('custom:')
          ? categoryId.slice('custom:'.length)
          : getCategoryLabel(CHECKLIST_CATEGORIES, categoryId, t),
        items,
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [t, trip.checklist]);

  function addItem(event) {
    event.preventDefault();
    if (!label.trim()) return;
    onUpdate({
      checklist: [...trip.checklist, { id: createId('check'), label: label.trim(), category, listTitle: customListTitle.trim(), completed: false }],
    });
    setLabel('');
    setCustomListTitle('');
    setShowCustomList(false);
  }

  function toggleItem(itemId) {
    onUpdate({
      checklist: trip.checklist.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item),
    });
  }

  function removeItem(itemId) {
    onUpdate({ checklist: trip.checklist.filter((item) => item.id !== itemId) });
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('checklist.eyebrow')}</p>
          <h2>{t('checklist.title')}</h2>
          <p>{t('checklist.intro')}</p>
        </div>
      </section>

      <Card className="checklist-progress-card">
        <div>
          <span className="checklist-progress-card__icon"><Icon name="checklist" size={24} /></span>
          <div>
            <span>{t('checklist.progress')}</span>
            <strong>{t('checklist.completedCount', { done: trip.checklistCompleted, total: trip.checklistTotal })}</strong>
          </div>
        </div>
        <div>
          <strong>{Math.round(progress)}%</strong>
          <ProgressBar value={progress} label={t('checklist.completion')} />
        </div>
      </Card>

      <Card className="checklist-add-card">
        <form className="checklist-add-form" onSubmit={addItem}>
          <label>
            <span className="sr-only">{t('checklist.newItem')}</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('checklist.placeholder')} />
          </label>
          <select aria-label={t('checklist.category')} value={category} onChange={(event) => setCategory(event.target.value)}>
            {CHECKLIST_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{t(item.labelKey)}</option>
            ))}
          </select>
          {showCustomList ? (
            <label className="checklist-add-form__custom-list">
              <span className="sr-only">{t('checklist.customListTitle')}</span>
              <input autoFocus value={customListTitle} onChange={(event) => setCustomListTitle(event.target.value)} placeholder={t('checklist.customListPlaceholder')} />
            </label>
          ) : (
            <Button type="button" variant="secondary" icon="plus" onClick={() => setShowCustomList(true)}>{t('checklist.addList')}</Button>
          )}
          <Button type="submit" icon="plus">{t('common.add')}</Button>
        </form>
      </Card>

      {groupedItems.length > 0 ? (
        <div className="checklist-groups">
          {groupedItems.map((group) => (
            <Card key={group.id} className="checklist-group">
              <header><div><h3>{group.label}</h3><span>{group.items.filter((item) => item.completed).length}/{group.items.length}</span></div></header>
              <div className="checklist-items">
                {group.items.map((item) => (
                  <article key={item.id} className={item.completed ? 'checklist-item checklist-item--completed' : 'checklist-item'}>
                    <button
                      className="checklist-item__toggle"
                      type="button"
                      aria-label={t(item.completed ? 'checklist.markIncomplete' : 'checklist.markComplete', { label: item.label })}
                      onClick={() => toggleItem(item.id)}
                    >
                      <Icon name={item.completed ? 'check' : 'circle'} size={17} />
                    </button>
                    <span>{item.label}</span>
                    <button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${item.label}`} onClick={() => removeItem(item.id)}>
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
          <h3>{t('checklist.emptyTitle')}</h3>
          <p>{t('checklist.emptyText')}</p>
        </section>
      )}
    </div>
  );
}
