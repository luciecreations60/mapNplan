import { createContext, useCallback, useMemo, useState } from 'react';
import { templateService } from '../services/templates/TemplateService.js';

export const TemplateContext = createContext(null);

/**
 * Keeps reusable templates synchronized with browser storage.
 */
export function TemplateProvider({ children }) {
  const [tripTemplates, setTripTemplates] = useState(() => templateService.getTripTemplates());
  const [dayTemplates, setDayTemplates] = useState(() => templateService.getDayTemplates());

  const refreshTemplates = useCallback(() => {
    setTripTemplates(templateService.getTripTemplates());
    setDayTemplates(templateService.getDayTemplates());
  }, []);

  const saveTripAsTemplate = useCallback((trip, options) => {
    const saved = templateService.saveTripAsTemplate(trip, options);
    refreshTemplates();
    return saved;
  }, [refreshTemplates]);

  const saveDayFromTrip = useCallback((day, options) => {
    const saved = templateService.saveDayFromTrip(day, options);
    refreshTemplates();
    return saved;
  }, [refreshTemplates]);

  const removeTripTemplate = useCallback((id) => {
    const removed = templateService.removeTripTemplate(id);
    refreshTemplates();
    return removed;
  }, [refreshTemplates]);

  const removeDayTemplate = useCallback((id) => {
    const removed = templateService.removeDayTemplate(id);
    refreshTemplates();
    return removed;
  }, [refreshTemplates]);

  const materializeTrip = useCallback((template, payload) => templateService.materializeTrip(template, payload), []);

  const applyDayTemplate = useCallback((trip, template, date) => templateService.applyDayTemplate(trip, template, date), []);

  const exportTemplates = useCallback(() => templateService.downloadLibrary(), []);

  const importTemplates = useCallback(async (file) => {
    const result = await templateService.importLibrary(file);
    refreshTemplates();
    return result;
  }, [refreshTemplates]);

  const value = useMemo(() => ({
    tripTemplates,
    dayTemplates,
    saveTripAsTemplate,
    saveDayFromTrip,
    removeTripTemplate,
    removeDayTemplate,
    materializeTrip,
    applyDayTemplate,
    exportTemplates,
    importTemplates,
    refreshTemplates,
  }), [
    applyDayTemplate,
    dayTemplates,
    exportTemplates,
    importTemplates,
    materializeTrip,
    refreshTemplates,
    removeDayTemplate,
    removeTripTemplate,
    saveDayFromTrip,
    saveTripAsTemplate,
    tripTemplates,
  ]);

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}
