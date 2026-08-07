import { useContext } from 'react';
import { TemplateContext } from '../contexts/TemplateContext.jsx';

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (!context) throw new Error('useTemplates must be used inside TemplateProvider.');
  return context;
}
