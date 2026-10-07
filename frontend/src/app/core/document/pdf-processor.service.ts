import { Injectable } from '@angular/core';
import { DocumentProcessor, ExtractedBookMetadata } from './document-processor.interface';
import { DocumentChunk, FileType } from '../models/book.model';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';
}

@Injectable({
  providedIn: 'root'
})
export class PdfProcessorService implements DocumentProcessor {
  readonly supportedType: FileType = 'pdf';

  canProcess(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  async extractMetadata(buffer: ArrayBuffer, fileName: string): Promise<ExtractedBookMetadata> {
    try {
      const dataCopy = new Uint8Array(buffer.slice(0));
      const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
      const pdf = await loadingTask.promise;
      const meta = await pdf.getMetadata().catch(() => null);
      
      const numPages = pdf.numPages;
      const cleanFileName = fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      
      let title = cleanFileName;
      let author = 'Unknown Author';
      let creationDate: string | undefined;

      if (meta?.info) {
        const info = meta.info as any;
        if (info.Title && info.Title.trim().length > 1) {
          title = info.Title.trim();
        }
        if (info.Author && info.Author.trim().length > 1) {
          author = info.Author.trim();
        }
        if (info.CreationDate) {
          creationDate = info.CreationDate;
        }
      }

      let coverDataUrl: string | undefined;
      try {
        const page1 = await pdf.getPage(1);
        const viewport = page1.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        if (ctx) {
          await page1.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          coverDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch (err) {
        console.warn('Could not extract PDF cover thumbnail:', err);
      }

      const authors = author.includes(';') 
        ? author.split(';').map(a => a.trim()) 
        : author.includes(',') 
        ? author.split(',').map(a => a.trim()) 
        : [author];

      return {
        title,
        authors: authors.filter(Boolean),
        pageCount: numPages,
        coverDataUrl,
        language: 'en',
        publicationYear: creationDate ? new Date(creationDate).getFullYear() : undefined
      };
    } catch (error) {
      console.error('Failed to parse PDF metadata:', error);
      return {
        title: fileName.replace(/\.pdf$/i, ''),
        authors: ['Unknown Author'],
        pageCount: 1
      };
    }
  }

  async extractChunks(buffer: ArrayBuffer, bookId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    try {
      const dataCopy = new Uint8Array(buffer.slice(0));
      const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
      const pdf = await loadingTask.promise;
      const numPages = Math.min(pdf.numPages, 100);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText.length > 20) {
            const paragraphs = pageText.split(/(?<=[.?!])\s+/);
            let currentChunkText = '';

            for (const para of paragraphs) {
              if ((currentChunkText + ' ' + para).length > 800) {
                if (currentChunkText.trim().length > 0) {
                  chunks.push({
                    id: `${bookId}_p${pageNum}_c${chunks.length + 1}`,
                    bookId,
                    pageNumber: pageNum,
                    text: currentChunkText.trim(),
                    tokenCount: currentChunkText.split(' ').length
                  });
                }
                currentChunkText = para;
              } else {
                currentChunkText += (currentChunkText ? ' ' : '') + para;
              }
            }

            if (currentChunkText.trim().length > 0) {
              chunks.push({
                id: `${bookId}_p${pageNum}_c${chunks.length + 1}`,
                bookId,
                pageNumber: pageNum,
                text: currentChunkText.trim(),
                tokenCount: currentChunkText.split(' ').length
              });
            }
          }
        } catch (pageErr) {
          console.warn(`Error extracting text from PDF page ${pageNum}:`, pageErr);
        }
      }
    } catch (err) {
      console.error('Error extracting PDF chunks:', err);
    }
    return chunks;
  }
}
