/**
 * Apply the interface language to every vector-map label that is backed by a
 * place name. OpenFreeMap exposes OpenStreetMap translated-name properties,
 * while MapLibre lets us replace each symbol layer's text expression at run
 * time. The English fallback prevents local scripts from unexpectedly taking
 * over when a French translation is unavailable.
 */
export function applyMapLanguage(map, language = 'en') {
  if (!map?.isStyleLoaded?.()) return;

  const languageCode = String(language || 'en').slice(0, 2).toLowerCase();
  if (map.__mapNplanLanguage === languageCode) return;
  const nameExpression = buildLocalizedNameExpression(languageCode);
  const layers = map.getStyle()?.layers || [];

  layers.forEach((layer) => {
    if (layer.type !== 'symbol') return;
    const textField = layer.layout?.['text-field'];
    if (!textField || !JSON.stringify(textField).toLowerCase().includes('name')) return;

    try {
      map.setLayoutProperty(layer.id, 'text-field', nameExpression);
    } catch {
      // Third-party styles may contain immutable or non-standard symbol layers.
    }
  });
  map.__mapNplanLanguage = languageCode;
}

export function buildLocalizedNameExpression(language = 'en') {
  const localizedKeys = language === 'en'
    ? ['name:en', 'name_en']
    : [`name:${language}`, `name_${language}`, 'name:en', 'name_en'];

  return [
    'coalesce',
    ...localizedKeys.map((key) => ['get', key]),
    ['get', 'name:latin'],
  ];
}

export function createMapMarkerElement({ color = '#1f90ad', size = 18, label = '', number = '' } = {}) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'maplibre-point-marker';
  element.style.setProperty('--marker-color', color);
  element.style.setProperty('--marker-size', `${size}px`);
  element.setAttribute('aria-label', label || 'Map point');

  const visual = document.createElement('span');
  visual.className = 'maplibre-point-marker__visual';
  visual.setAttribute('aria-hidden', 'true');
  if (number !== '' && number !== null && number !== undefined) {
    const numberNode = document.createElement('span');
    numberNode.className = 'maplibre-point-marker__number';
    numberNode.textContent = String(number);
    visual.append(numberNode);
  }
  element.append(visual);
  return element;
}
