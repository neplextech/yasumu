export { ImageViewer } from './image-viewer';
export { VideoViewer } from './video-viewer';
export { AudioViewer } from './audio-viewer';
export { HtmlViewer } from './html-viewer';
export { CsvViewer } from './csv-viewer';
export { TextViewer } from './text-viewer';
export { BinaryViewer } from './binary-viewer';
export { PdfViewer } from './pdf-viewer/pdf-viewer';

export type ContentCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'html'
  | 'csv'
  | 'text'
  | 'pdf'
  | 'binary';

export function getContentType(headers: Record<string, string>): string {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'content-type',
  );
  return entry?.[1] || '';
}

export function categorizeContent(contentType: string): ContentCategory {
  const ct = contentType.toLowerCase();

  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('video/')) return 'video';
  if (ct.startsWith('audio/')) return 'audio';
  if (ct.includes('text/html')) return 'html';
  if (ct.includes('application/pdf')) return 'pdf';
  if (ct.endsWith('/csv')) return 'csv';
  if (
    ct.startsWith('text/') ||
    ct.includes('json') ||
    ct.includes('xml') ||
    ct.includes('javascript')
  ) {
    return 'text';
  }

  return 'binary';
}

export function createBlobUrlFromBuffer(
  buffer: ArrayBuffer,
  contentType: string,
): string {
  const blob = new Blob([buffer], { type: contentType });
  return URL.createObjectURL(blob);
}

export function createBlobUrlFromText(
  text: string,
  contentType: string,
): string {
  const blob = new Blob([text], { type: contentType });
  return URL.createObjectURL(blob);
}
