import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../hooks/useI18n.js';
import { Card } from '../../common/Card.jsx';
import { Icon } from '../../common/Icon.jsx';

export function LocalTimeCard({ timezone, timezoneAbbreviation, locationLabel }) {
  const { locale, t } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timerId);
  }, []);

  const formatted = useMemo(() => {
    if (!timezone) return null;
    try {
      return {
        time: new Intl.DateTimeFormat(locale, { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now),
        date: new Intl.DateTimeFormat(locale, { timeZone: timezone, weekday: 'long', day: 'numeric', month: 'long' }).format(now),
      };
    } catch {
      return null;
    }
  }, [locale, now, timezone]);

  return (
    <Card className="travel-tool-card local-time-card">
      <header className="travel-tool-card__header">
        <div><p className="eyebrow">{t('tools.now')}</p><h2>{t('tools.localTime')}</h2><small>{locationLabel || t('tools.destination')}</small></div>
        <span className="travel-tool-card__header-icon"><Icon name="clock" /></span>
      </header>

      {formatted ? (
        <div className="local-time-card__body"><strong>{formatted.time}</strong><span>{formatted.date}</span><small>{timezoneAbbreviation || timezone}</small></div>
      ) : (
        <div className="travel-tool-error travel-tool-error--compact">
          <Icon name="clock" size={26} /><strong>{t('tools.timeUnavailable')}</strong><p>{t('tools.timeUnavailableText')}</p>
        </div>
      )}
    </Card>
  );
}
