import * as pdfjsLib from 'pdfjs-dist';

// Bundle the worker via Vite's ?url import — works fully offline
// (no CDN dependency, which would break when the user goes offline)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

/**
 * Parse a PDF File object into an array of page objects.
 * @param {File} file
 * @returns {Promise<Array<{pageNumber: number, text: string}>>}
 */
export async function parsePdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Join items; preserve spacing between words
    const text = content.items.map((it) => it.str).join(' ');
    pages.push({ pageNumber: i, text });
  }

  return pages; // [{ pageNumber, text }, ...]
}