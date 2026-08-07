import { useContext } from 'react';
import { LocalizationContext } from '../contexts/LocalizationContext.jsx';

export function useI18n() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useI18n must be used inside LocalizationProvider.');
  return context;
}
