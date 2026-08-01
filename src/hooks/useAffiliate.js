import { useContext } from 'react';
import { AffiliateContext } from '../contexts/AffiliateContext.jsx';

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (!context) throw new Error('useAffiliate must be used inside AffiliateProvider.');
  return context;
}
