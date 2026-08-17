export const TRIP_ACCENTS = Object.freeze([
  { id: 'violet', swatch: 'linear-gradient(135deg, #157a95, #1f90ad 52%, #2cbb6b)' },
  { id: 'aqua', swatch: 'linear-gradient(135deg, #167f98, #22afa7 55%, #4aca83)' },
  { id: 'coral', swatch: 'linear-gradient(135deg, #1f90ad, #2cbb6b 62%, #f4a06b)' },
  { id: 'lagoon', swatch: 'linear-gradient(135deg, #0f6f86, #1f90ad, #5bd0b6)' },
  { id: 'forest', swatch: 'linear-gradient(135deg, #176d62, #2cbb6b, #7fc66a)' },
  { id: 'sunset', swatch: 'linear-gradient(135deg, #1f90ad, #d79a42, #f08a6e)' },
  { id: 'rose', swatch: 'linear-gradient(135deg, #1f90ad, #b76ca8, #e7859a)' },
  { id: 'night', swatch: 'linear-gradient(135deg, #0f172a, #1f5f78, #1f90ad)' },
]);

export const TRIP_ACCENT_IDS = Object.freeze(TRIP_ACCENTS.map((accent) => accent.id));
