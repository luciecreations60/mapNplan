const DEFAULT_MAX_FILE_SIZE = 12 * 1024 * 1024;

/**
 * Converts a user-selected cover into a compact local image.
 * The resulting data URL is intentionally stored with the trip so the cover
 * continues to work on GitHub Pages without an upload server.
 */
export async function createTripCoverDataUrl(file, {
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.84,
} = {}) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    throw new Error('unsupported-image');
  }
  if (file.size > maxFileSize) throw new Error('image-too-large');

  const source = await readFile(file);
  const image = await loadImage(source);
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('image-processing-unavailable');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('image-read-failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-read-failed'));
    image.src = source;
  });
}
