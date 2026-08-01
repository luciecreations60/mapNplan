import { createContext, useCallback, useMemo, useState } from 'react';
import { contentStudioService } from '../services/content/ContentStudioService.js';

export const ContentStudioContext = createContext(null);

/**
 * Editorial state boundary for SEO destination content.
 *
 * Local storage can later be replaced by a CMS API without changing the page
 * components because all mutations pass through the content service.
 */
export function ContentStudioProvider({ children }) {
  const [articles, setArticles] = useState(() => contentStudioService.getArticles());

  const refresh = useCallback(() => setArticles(contentStudioService.getArticles()), []);

  const saveArticle = useCallback((payload) => {
    const saved = contentStudioService.saveArticle(payload);
    refresh();
    return saved;
  }, [refresh]);

  const deleteArticle = useCallback((id) => {
    const removed = contentStudioService.deleteArticle(id);
    refresh();
    return removed;
  }, [refresh]);

  const duplicateArticle = useCallback((id) => {
    const duplicated = contentStudioService.duplicateArticle(id);
    refresh();
    return duplicated;
  }, [refresh]);

  const importLibrary = useCallback(async (file) => {
    const result = await contentStudioService.importLibrary(file);
    refresh();
    return result;
  }, [refresh]);

  const value = useMemo(() => ({
    articles,
    saveArticle,
    deleteArticle,
    duplicateArticle,
    exportLibrary: () => contentStudioService.exportLibrary(),
    importLibrary,
    downloadHtml: (article, options) => contentStudioService.downloadHtml(article, options),
    downloadSitemap: (baseUrl) => contentStudioService.downloadSitemap(baseUrl),
    downloadRobots: (baseUrl) => contentStudioService.downloadRobots(baseUrl),
    findBySlug: (slug) => contentStudioService.findBySlug(slug),
    refresh,
  }), [articles, deleteArticle, duplicateArticle, importLibrary, refresh, saveArticle]);

  return <ContentStudioContext.Provider value={value}>{children}</ContentStudioContext.Provider>;
}
