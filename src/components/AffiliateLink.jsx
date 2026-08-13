import PropTypes from 'prop-types';

function withUtm(url, source = 'mapnplan', medium = 'affiliate', campaign = 'bons-plans') {
  try {
    const u = new URL(url);
    if (!u.searchParams.get('utm_source')) u.searchParams.set('utm_source', source);
    if (!u.searchParams.get('utm_medium')) u.searchParams.set('utm_medium', medium);
    if (!u.searchParams.get('utm_campaign')) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  } catch {
    return url;
  }
}

export default function AffiliateLink({
  href,
  children,
  partnerName,
  source,
  medium,
  campaign,
  className,
}) {
  const finalHref = withUtm(href, source, medium, campaign);

  const onClick = () => {
    // GA4 (si présent)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        partner_name: partnerName || 'unknown',
        destination: finalHref,
      });
    }

    // Fallback dataLayer
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'affiliate_click',
        partner_name: partnerName || 'unknown',
        destination: finalHref,
      });
    }
  };

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  );
}

AffiliateLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  partnerName: PropTypes.string,
  source: PropTypes.string,
  medium: PropTypes.string,
  campaign: PropTypes.string,
  className: PropTypes.string,
};

AffiliateLink.defaultProps = {
  partnerName: 'unknown',
  source: 'mapnplan',
  medium: 'affiliate',
  campaign: 'bons-plans',
  className: '',
};
