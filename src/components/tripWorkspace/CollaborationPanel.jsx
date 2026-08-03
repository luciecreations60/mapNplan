
import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../../config/app.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { formatLocalizedDateTime } from '../../utils/date.js';
import { tripShareService } from '../../services/share/TripShareService.js';
import { appendActivityEntry, createActivityEntry, getCurrentActorName } from '../../utils/collaboration.js';
import { createId } from '../../utils/id.js';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Card } from '../common/Card.jsx';
import { Icon } from '../common/Icon.jsx';
import { InlineNotice } from '../feedback/InlineNotice.jsx';

const EMPTY_MEMBER = Object.freeze({ name: '', email: '', role: 'editor' });
const ROLE_TONES = Object.freeze({ owner: 'success', editor: 'info', viewer: 'neutral' });

export function CollaborationPanel({ trip, onUpdate }) {
  const { locale, t } = useI18n();
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);
  const [shareOptions, setShareOptions] = useState({
    includeBudget: false,
    includeNotes: false,
    includeChecklist: true,
  });
  const [shareResult, setShareResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const collaboration = trip.collaboration;
  const actorName = getCurrentActorName(trip);
  const sortedActivity = useMemo(
    () => [...collaboration.activityLog].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [collaboration.activityLog],
  );

  function updateMemberField(event) {
    const { name, value } = event.target;
    setMemberForm((current) => ({ ...current, [name]: value }));
  }

  function addMember(event) {
    event.preventDefault();
    if (!memberForm.name.trim()) return;

    const member = {
      id: createId('member'),
      name: memberForm.name.trim(),
      email: memberForm.email.trim().toLowerCase(),
      role: memberForm.role,
      addedAt: new Date().toISOString(),
    };
    const entry = createActivityEntry({
      action: 'memberAdded',
      actorName,
      entityType: 'member',
      entityId: member.id,
      targetTitle: member.name,
    });

    onUpdate({
      collaboration: appendActivityEntry({
        ...collaboration,
        members: [...collaboration.members, member],
      }, entry),
    });
    setMemberForm(EMPTY_MEMBER);
    setNotice({ tone: 'success', title: t('collaboration.memberAdded'), message: t('collaboration.memberAddedText', { name: member.name }) });
  }

  function updateMemberRole(memberId, role) {
    const member = collaboration.members.find((item) => item.id === memberId);
    if (!member || member.role === 'owner') return;
    const entry = createActivityEntry({
      action: 'memberRoleChanged',
      actorName,
      entityType: 'member',
      entityId: member.id,
      targetTitle: member.name,
    });

    onUpdate({
      collaboration: appendActivityEntry({
        ...collaboration,
        members: collaboration.members.map((item) => item.id === memberId ? { ...item, role } : item),
      }, entry),
    });
  }

  function removeMember(member) {
    if (member.role === 'owner') return;
    if (!window.confirm(t('collaboration.removeConfirm', { name: member.name }))) return;
    const entry = createActivityEntry({
      action: 'memberRemoved',
      actorName,
      entityType: 'member',
      entityId: member.id,
      targetTitle: member.name,
    });
    onUpdate({
      collaboration: appendActivityEntry({
        ...collaboration,
        members: collaboration.members.filter((item) => item.id !== member.id),
      }, entry),
    });
  }

  function generateShare() {
    try {
      const snapshot = tripShareService.createSnapshot(trip, shareOptions);
      const result = tripShareService.createShareUrl(snapshot);
      const entry = createActivityEntry({
        action: 'shareCreated',
        actorName,
        entityType: 'share',
        targetTitle: trip.name,
      });
      setShareResult({ ...result, snapshot });
      onUpdate({
        collaboration: appendActivityEntry({
          ...collaboration,
          share: { enabled: true, lastCreatedAt: new Date().toISOString() },
        }, entry),
      });
      setNotice({ tone: 'success', title: t('collaboration.shareReady'), message: t('collaboration.shareReadyText') });
    } catch (error) {
      console.error(error);
      setNotice({ tone: 'danger', title: t('collaboration.shareFailed'), message: t('collaboration.shareFailedText') });
    }
  }

  async function copyShareLink() {
    if (!shareResult?.url) return;
    try {
      await tripShareService.copyToClipboard(shareResult.url);
      setNotice({ tone: 'success', title: t('collaboration.linkCopied'), message: t('collaboration.linkCopiedText') });
    } catch (error) {
      setNotice({ tone: 'danger', title: t('collaboration.copyFailed'), message: t('collaboration.copyFailedText') });
    }
  }

  return (
    <div className="workspace-section collaboration-panel">
      <section className="workspace-section__heading">
        <div>
          <p className="eyebrow">{t('collaboration.eyebrow')}</p>
          <h2>{t('collaboration.title')}</h2>
          <p>{t('collaboration.intro')}</p>
        </div>
        <Badge tone="warning">{t('collaboration.localMode')}</Badge>
      </section>

      {notice && (
        <InlineNotice tone={notice.tone} title={notice.title} className="page-notice">
          {notice.message}
        </InlineNotice>
      )}

      <InlineNotice tone="info" title={t('collaboration.backendTitle')}>
        {t('collaboration.backendText')}
      </InlineNotice>

      <div className="collaboration-grid">
        <Card className="workspace-panel collaboration-share-card">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('collaboration.shareEyebrow')}</p>
              <h3>{t('collaboration.shareTitle')}</h3>
            </div>
            <span className="collaboration-share-card__icon"><Icon name="share" /></span>
          </header>
          <p>{t('collaboration.shareText')}</p>

          <div className="share-options">
            <ShareOption
              checked={shareOptions.includeChecklist}
              label={t('collaboration.includeChecklist')}
              onChange={(checked) => setShareOptions((current) => ({ ...current, includeChecklist: checked }))}
            />
            <ShareOption
              checked={shareOptions.includeBudget}
              label={t('collaboration.includeBudget')}
              onChange={(checked) => setShareOptions((current) => ({ ...current, includeBudget: checked }))}
            />
            <ShareOption
              checked={shareOptions.includeNotes}
              label={t('collaboration.includeNotes')}
              onChange={(checked) => setShareOptions((current) => ({ ...current, includeNotes: checked }))}
            />
          </div>

          <p className="share-privacy"><Icon name="shield" size={16} /> {t('collaboration.privacyText')}</p>
          <Button icon="share" onClick={generateShare}>{t('collaboration.generateLink')}</Button>

          {shareResult && (
            <div className="share-result">
              <label>
                <span>{t('collaboration.shareLink')}</span>
                <textarea readOnly rows="3" value={shareResult.url} onFocus={(event) => event.target.select()} />
              </label>
              {shareResult.exceedsRecommendedLength && (
                <InlineNotice tone="warning" title={t('collaboration.longLinkTitle')}>
                  {t('collaboration.longLinkText')}
                </InlineNotice>
              )}
              <div className="share-result__actions">
                <Button size="small" icon="copy" onClick={copyShareLink}>{t('collaboration.copyLink')}</Button>
                <Button size="small" variant="secondary" icon="externalLink" onClick={() => window.open(shareResult.url, '_blank', 'noopener,noreferrer')}>
                  {t('collaboration.previewLink')}
                </Button>
                <Button size="small" variant="ghost" icon="download" onClick={() => tripShareService.downloadSnapshot(shareResult.snapshot)}>
                  {t('collaboration.downloadSnapshot')}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="workspace-panel collaboration-members-card">
          <header className="workspace-panel__header">
            <div>
              <p className="eyebrow">{t('collaboration.peopleEyebrow')}</p>
              <h3>{t('collaboration.peopleTitle')}</h3>
            </div>
            <span>{t(collaboration.members.length === 1 ? 'collaboration.memberCountOne' : 'collaboration.memberCountMany', { count: collaboration.members.length })}</span>
          </header>

          <div className="member-list">
            {collaboration.members.map((member) => (
              <article key={member.id} className="member-row">
                <span className="member-avatar">{getInitials(member.name)}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.email || t('collaboration.localProfile')}</small>
                </div>
                {member.role === 'owner' ? (
                  <Badge tone={ROLE_TONES[member.role]}>{t(`collaboration.roles.${member.role}`)}</Badge>
                ) : (
                  <select value={member.role} aria-label={t('collaboration.roleFor', { name: member.name })} onChange={(event) => updateMemberRole(member.id, event.target.value)}>
                    <option value="editor">{t('collaboration.roles.editor')}</option>
                    <option value="viewer">{t('collaboration.roles.viewer')}</option>
                  </select>
                )}
                {member.role !== 'owner' && (
                  <button className="icon-button icon-button--small" type="button" aria-label={t('collaboration.removeMember', { name: member.name })} onClick={() => removeMember(member)}>
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </article>
            ))}
          </div>

          <form className="member-form" onSubmit={addMember}>
            <h4>{t('collaboration.addPerson')}</h4>
            <div className="member-form__grid">
              <label><span>{t('collaboration.name')}</span><input name="name" value={memberForm.name} maxLength="80" onChange={updateMemberField} required /></label>
              <label><span>{t('collaboration.email')}</span><input name="email" type="email" value={memberForm.email} onChange={updateMemberField} placeholder="name@example.com" /></label>
              <label><span>{t('collaboration.role')}</span><select name="role" value={memberForm.role} onChange={updateMemberField}><option value="editor">{t('collaboration.roles.editor')}</option><option value="viewer">{t('collaboration.roles.viewer')}</option></select></label>
            </div>
            <Button type="submit" size="small" icon="userPlus">{t('collaboration.addPersonAction')}</Button>
          </form>
        </Card>
      </div>

      <Card className="workspace-panel activity-log-card">
        <header className="workspace-panel__header">
          <div><p className="eyebrow">{t('collaboration.activityEyebrow')}</p><h3>{t('collaboration.activityTitle')}</h3></div>
          <span>{t('collaboration.latestActions')}</span>
        </header>
        {sortedActivity.length > 0 ? (
          <div className="activity-log">
            {sortedActivity.slice(0, 40).map((entry) => (
              <article key={entry.id} className="activity-log__entry">
                <span><Icon name={getActivityIcon(entry.action)} size={17} /></span>
                <div>
                  <p>{translateActivity(entry, t)}</p>
                  <time dateTime={entry.createdAt}>{formatLocalizedDateTime(entry.createdAt, locale)}</time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty workspace-empty--compact">
            <span><Icon name="activity" size={24} /></span>
            <h3>{t('collaboration.noActivity')}</h3>
            <p>{t('collaboration.noActivityText')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function ShareOption({ checked, label, onChange }) {
  return (
    <label className="share-option">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span><Icon name={checked ? 'checkCircle' : 'circle'} size={18} /> {label}</span>
    </label>
  );
}

function getInitials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getActivityIcon(action) {
  return {
    memberAdded: 'userPlus',
    memberRemoved: 'userMinus',
    memberRoleChanged: 'users',
    commentAdded: 'message',
    shareCreated: 'share',
  }[action] || 'activity';
}

function translateActivity(entry, t) {
  return t(`collaboration.activityActions.${entry.action}`, {
    actor: entry.actorName || APP_CONFIG.demoUserName,
    target: entry.targetTitle || t('collaboration.thisTrip'),
  });
}
