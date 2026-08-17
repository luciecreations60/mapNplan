export const TRIP_ACCENTS = Object.freeze([
  { id: 'violet', swatch: 'linear-gradient(135deg, #157A95, #1F90AD 52%, #2CBB6B)' },
  { id: 'aqua', swatch: 'linear-gradient(135deg, #1557B0, #2787D8, #73C7F5)' },
  { id: 'coral', swatch: 'linear-gradient(135deg, #D94B45, #F17361, #FFB07B)' },
  { id: 'lagoon', swatch: 'linear-gradient(135deg, #087F8C, #10B8B0, #72DDD2)' },
  { id: 'forest', swatch: 'linear-gradient(135deg, #1E6338, #2C9B55, #77C66E)' },
  { id: 'sunset', swatch: 'linear-gradient(135deg, #E77A16, #F3A62D, #FFD36A)' },
  { id: 'rose', swatch: 'linear-gradient(135deg, #B83280, #E65B9B, #F7A4C6)' },
  { id: 'night', swatch: 'linear-gradient(135deg, #0F172A, #243B63, #416A9C)' },
]);

export const TRIP_ACCENT_IDS = Object.freeze(TRIP_ACCENTS.map((accent) => accent.id));
