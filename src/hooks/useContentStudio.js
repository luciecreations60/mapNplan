import { useContext } from 'react';
import { ContentStudioContext } from '../contexts/ContentStudioContext.jsx';

export function useContentStudio() {
  const context = useContext(ContentStudioContext);
  if (!context) throw new Error('useContentStudio must be used inside ContentStudioProvider.');
  return context;
}
