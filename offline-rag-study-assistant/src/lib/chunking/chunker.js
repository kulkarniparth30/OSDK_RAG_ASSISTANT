export function chunkText(pages, filename, maxWords = 150) {
  const chunks = [];
  
  for (const { pageNumber, text } of pages) {
    // Split into sentences using punctuation boundaries
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
    
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      const wordCount = words.length;
      
      // If adding this sentence exceeds the limit and we already have some text
      if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
        chunks.push({
          id: `${filename}-p${pageNumber}-${chunkIndex++}`,
          text: currentChunk.join(' '),
          source: filename,
          page: pageNumber,
        });
        currentChunk = [];
        currentWordCount = 0;
      }
      
      currentChunk.push(sentence.trim());
      currentWordCount += wordCount;
    }
    
    // Push the final chunk for this page if it has content
    if (currentChunk.length > 0) {
      chunks.push({
        id: `${filename}-p${pageNumber}-${chunkIndex++}`,
        text: currentChunk.join(' '),
        source: filename,
        page: pageNumber,
      });
    }
  }
  
  return chunks;
}