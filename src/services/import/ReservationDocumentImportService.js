import { attachmentStorageService } from '../storage/AttachmentStorageService.js';
import { analyzeReservationText } from '../../utils/reservationImport.js';

const PDFJS_VERSION = '6.2.108';
const TESSERACT_VERSION = '7.0.0';
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
const TESSERACT_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;

class ReservationDocumentImportService {
  async analyze(file, options = {}) {
    attachmentStorageService.validateFile(file);
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    onProgress({ stage: 'reading', progress: 0.05 });

    const extraction = await this.extractText(file, { onProgress });
    onProgress({ stage: 'parsing', progress: 0.9 });
    const draft = analyzeReservationText(extraction.text, {
      fileName: file.name,
      currency: options.currency,
      tripStartDate: options.tripStartDate,
      tripEndDate: options.tripEndDate,
    });
    onProgress({ stage: 'ready', progress: 1 });

    return {
      draft,
      file,
      extractionMethod: extraction.method,
      extractedText: extraction.text,
      warnings: extraction.warnings || [],
    };
  }

  async extractText(file, { onProgress = () => {} } = {}) {
    const type = String(file.type || '').toLowerCase();
    const name = String(file.name || '').toLowerCase();

    if (type === 'text/plain' || name.endsWith('.txt')) {
      return { text: await file.text(), method: 'text', warnings: [] };
    }
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return this.#extractPdfText(file, onProgress);
    }
    if (type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(name)) {
      return this.#extractImageText(file, onProgress);
    }
    throw new Error('Only PDF, image and text files can be analysed automatically for now.');
  }

  async #extractPdfText(file, onProgress) {
    onProgress({ stage: 'loadingPdf', progress: 0.12 });
    const pdfjs = await import(/* @vite-ignore */ PDFJS_MODULE_URL);
    if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages = [];
    const maxPages = Math.min(pdf.numPages, 25);

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
      onProgress({ stage: 'readingPdf', progress: 0.15 + (pageNumber / maxPages) * 0.65 });
    }

    let text = pages.join('\n').trim();
    const warnings = pdf.numPages > maxPages ? ['pdfTruncated'] : [];
    if (text.length < 40) {
      const ocrText = await this.#ocrPdfPages(pdf, onProgress);
      if (ocrText) {
        text = ocrText;
        warnings.push('pdfOcrFallback');
      }
    }
    if (!text) throw new Error('No readable text was detected in this PDF.');
    return {
      text,
      method: warnings.includes('pdfOcrFallback') ? 'pdf-ocr' : 'pdf-text',
      warnings,
    };
  }

  async #extractImageText(file, onProgress) {
    onProgress({ stage: 'loadingOcr', progress: 0.12 });
    const worker = await this.#createOcrWorker(onProgress, 0.2, 0.85);
    try {
      const result = await worker.recognize(file);
      const text = String(result?.data?.text || '').trim();
      if (!text) throw new Error('No readable text was detected in this image.');
      return { text, method: 'image-ocr', warnings: [] };
    } finally {
      await worker.terminate();
    }
  }

  async #ocrPdfPages(pdf, onProgress) {
    if (typeof document === 'undefined') return '';
    onProgress({ stage: 'loadingOcr', progress: 0.18 });
    const worker = await this.#createOcrWorker(onProgress, 0.25, 0.86);
    const pages = [];
    const pageCount = Math.min(pdf.numPages, 4);
    try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.45 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) continue;
        await page.render({ canvasContext: context, viewport }).promise;
        const result = await worker.recognize(canvas);
        const pageText = String(result?.data?.text || '').trim();
        if (pageText) pages.push(pageText);
        onProgress({ stage: 'ocr', progress: 0.25 + (pageNumber / pageCount) * 0.61 });
      }
      return pages.join('\n').trim();
    } finally {
      await worker.terminate();
    }
  }

  async #createOcrWorker(onProgress, startProgress, endProgress) {
    const tesseract = await loadTesseract();
    return tesseract.createWorker('fra+eng', 1, {
      logger: (message) => {
        if (message?.status !== 'recognizing text') return;
        const ratio = Math.max(0, Math.min(1, Number(message.progress) || 0));
        onProgress({ stage: 'ocr', progress: startProgress + ratio * (endProgress - startProgress) });
      },
    });
  }
}

export const reservationDocumentImportService = new ReservationDocumentImportService();


let tesseractLoaderPromise = null;
function loadTesseract() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Image recognition is only available in the browser.'));
  }
  if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
  if (tesseractLoaderPromise) return tesseractLoaderPromise;

  tesseractLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-mapnplan-tesseract]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load local image recognition.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = TESSERACT_SCRIPT_URL;
    script.async = true;
    script.dataset.mapnplanTesseract = 'true';
    script.onload = () => window.Tesseract?.createWorker
      ? resolve(window.Tesseract)
      : reject(new Error('Image recognition did not initialise correctly.'));
    script.onerror = () => reject(new Error('Unable to load local image recognition.'));
    document.head.appendChild(script);
  }).catch((error) => {
    tesseractLoaderPromise = null;
    throw error;
  });
  return tesseractLoaderPromise;
}
