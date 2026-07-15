import mammoth from 'mammoth';

/**
 * Parse a DOCX File object into an array of page objects.
 * Returns a single "page" entry since DOCX has no native page boundaries.
 * @param {File} file
 * @returns {Promise<Array<{pageNumber: number, text: string}>>}
 */
export async function parseDocx(file) {
  // mammoth expects a plain ArrayBuffer — do NOT wrap in Uint8Array
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  // Return same shape as pdfParser for a uniform pipeline
  return [{ pageNumber: 1, text }];
}