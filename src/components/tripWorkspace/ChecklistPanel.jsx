import { useMemo, useState } from 'react';
import { useI18n } from '../../hooks/useI18n.js';
import { createId } from '../../utils/id.js';
import { CHECKLIST_CATEGORIES, getCategoryLabel } from '../../utils/tripWorkspace.js';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function ChecklistPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('category:documents');
  const [showListForm, setShowListForm] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const customLists = trip.checklistLists || [];
  const progress = trip.checklistTotal > 0 ? (trip.checklistCompleted / trip.checklistTotal) * 100 : 0;

  const groupedItems = useMemo(() => {
    const groups = new Map();
    trip.checklist.forEach((item) => {
      const groupId = item.listTitle ? `custom:${item.listTitle}` : `category:${item.category}`;
      groups.set(groupId, [...(groups.get(groupId) || []), item]);
    });
    customLists.forEach((list) => {
      const key = `custom:${list.title}`;
      if (!groups.has(key)) groups.set(key, []);
    });
    return [...groups.entries()].map(([groupId, items]) => ({
      id: groupId,
      label: groupId.startsWith('custom:')
        ? groupId.slice('custom:'.length)
        : getCategoryLabel(CHECKLIST_CATEGORIES, groupId.slice('category:'.length), t),
      items,
      isCustom: groupId.startsWith('custom:'),
    })).sort((left, right) => left.label.localeCompare(right.label, locale, { sensitivity: 'base' }));
  }, [customLists, locale, t, trip.checklist]);

  function addList(event) {
    event.preventDefault();
    const title = listTitle.trim();
    if (!title) return;
    const exists = customLists.some((list) => list.title.toLocaleLowerCase(locale) === title.toLocaleLowerCase(locale));
    if (!exists) onUpdate({ checklistLists: [...customLists, { id: createId('checklist-list'), title }] });
    setTarget(`custom:${title}`);
    setListTitle('');
    setShowListForm(false);
  }

  function addItem(event) {
    event.preventDefault();
    if (!label.trim()) return;
    const isCustom = target.startsWith('custom:');
    onUpdate({
      checklist: [...trip.checklist, {
        id: createId('check'), label: label.trim(),
        category: isCustom ? 'other' : target.slice('category:'.length),
        listTitle: isCustom ? target.slice('custom:'.length) : '', completed: false,
      }],
    });
    setLabel('');
  }

  function toggleItem(itemId) {
    onUpdate({ checklist: trip.checklist.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item) });
  }

  function removeItem(itemId) {
    onUpdate({ checklist: trip.checklist.filter((item) => item.id !== itemId) });
  }

  function removeEmptyList(group) {
    if (!group.isCustom || group.items.length > 0) return;
    onUpdate({ checklistLists: customLists.filter((list) => list.title !== group.label) });
    if (target === `custom:${group.label}`) setTarget('category:documents');
  }

  return (
    <div className="workspace-section">
      <section className="workspace-section__heading">
        <div><p className="eyebrow">{t('checklist.eyebrow')}</p><h2>{t('checklist.title')}</h2><p>{t('checklist.intro')}</p></div>
        <Button variant="secondary" icon="plus" onClick={() => setShowListForm(true)}>{t('checklist.addList')}</Button>
      </section>

      <Card className="checklist-progress-card">
        <div><span className="checklist-progress-card__icon"><Icon name="checklist" size={24} /></span><div><span>{t('checklist.progress')}</span><strong>{t('checklist.completedCount', { done: trip.checklistCompleted, total: trip.checklistTotal })}</strong></div></div>
        <div><strong>{Math.round(progress)}%</strong><ProgressBar value={progress} label={t('checklist.completion')} /></div>
      </Card>

      {showListForm && (
        <Card className="checklist-list-creator">
          <form onSubmit={addList}>
            <label><span>{t('checklist.listName')}</span><input autoFocus value={listTitle} onChange={(event) => setListTitle(event.target.value)} placeholder={t('checklist.listNamePlaceholder')} /></label>
            <div><Button type="button" variant="ghost" onClick={() => { setShowListForm(false); setListTitle(''); }}>{t('common.cancel')}</Button><Button type="submit" icon="plus">{t('checklist.createList')}</Button></div>
          </form>
        </Card>
      )}

      <Card className="checklist-add-card">
        <form className="checklist-add-form" onSubmit={addItem}>
          <label><span className="sr-only">{t('checklist.newItem')}</span><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('checklist.placeholder')} /></label>
          <select aria-label={t('checklist.chooseList')} value={target} onChange={(event) => setTarget(event.target.value)}>
            <optgroup label={t('checklist.standardLists')}>
              {CHECKLIST_CATEGORIES.map((item) => <option key={item.id} value={`category:${item.id}`}>{t(item.labelKey)}</option>)}
            </optgroup>
            {customLists.length > 0 && <optgroup label={t('checklist.myLists')}>{customLists.map((list) => <option key={list.id} value={`custom:${list.title}`}>{list.title}</option>)}</optgroup>}
          </select>
          <Button type="submit" icon="plus">{t('common.add')}</Button>
        </form>
      </Card>

      {groupedItems.length > 0 ? (
        <div className="checklist-groups">
          {groupedItems.map((group) => (
            <Card key={group.id} className="checklist-group">
              <header><div><h3>{group.label}</h3><span>{group.items.filter((item) => item.completed).length}/{group.items.length}</span></div>{group.isCustom && group.items.length === 0 && <button className="icon-button icon-button--small" type="button" aria-label={t('checklist.deleteList', { name: group.label })} onClick={() => removeEmptyList(group)}><Icon name="trash" size={15} /></button>}</header>
              {group.items.length > 0 ? <div className="checklist-items">{group.items.map((item) => <article key={item.id} className={item.completed ? 'checklist-item checklist-item--completed' : 'checklist-item'}><button className="checklist-item__toggle" type="button" aria-label={t(item.completed ? 'checklist.markIncomplete' : 'checklist.markComplete', { label: item.label })} onClick={() => toggleItem(item.id)}><Icon name={item.completed ? 'check' : 'circle'} size={17} /></button><span>{item.label}</span><button className="icon-button icon-button--small" type="button" aria-label={`${t('common.delete')} ${item.label}`} onClick={() => removeItem(item.id)}><Icon name="trash" size={15} /></button></article>)}</div> : <p className="checklist-group__empty">{t('checklist.emptyList')}</p>}
            </Card>
          ))}
        </div>
      ) : <section className="workspace-large-empty"><span><Icon name="checklist" size={28} /></span><h3>{t('checklist.emptyTitle')}</h3><p>{t('checklist.emptyText')}</p></section>}
    </div>
  );
}
