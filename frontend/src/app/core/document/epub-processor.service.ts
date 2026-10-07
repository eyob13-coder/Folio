import { Injectable } from '@angular/core';
import { DocumentProcessor, ExtractedBookMetadata } from './document-processor.interface';
import { DocumentChunk, FileType } from '../models/book.model';
import ePub from 'epubjs';

@Injectable({
  providedIn: 'root'
})
export class EpubProcessorService implements DocumentProcessor {
  readonly supportedType: FileType = 'epub';

  canProcess(file: File): boolean {
    return file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');
  }

  async extractMetadata(buffer: ArrayBuffer, fileName: string): Promise<ExtractedBookMetadata> {
    try {
      const book = ePub(buffer.slice(0));
      await book.ready;
      
      const meta: any = await book.loaded.metadata;
      let coverDataUrl: string | undefined;

      try {
        const coverUrl = await book.coverUrl();
        if (coverUrl) {
          const response = await fetch(coverUrl);
          const blob = await response.blob();
          coverDataUrl = await this.blobToDataUrl(blob);
        }
      } catch (err) {
        console.warn('Could not extract EPUB cover:', err);
      }

      const cleanFileName = fileName.replace(/\.epub$/i, '').replace(/[-_]/g, ' ');
      const title = meta?.title && meta.title.trim().length > 1 ? meta.title.trim() : cleanFileName;
      const creator = meta?.creator || 'Unknown Author';
      const authors = typeof creator === 'string' ? [creator] : Array.isArray(creator) ? creator : ['Unknown Author'];

      return {
        title,
        authors,
        description: meta?.description,
        publisher: meta?.publisher,
        language: meta?.language || 'en',
        publicationYear: meta?.pubdate ? new Date(meta.pubdate).getFullYear() : undefined,
        pageCount: 0, // EPUB pagination is computed dynamically
        coverDataUrl
      };
    } catch (error) {
      console.error('Failed to parse EPUB metadata:', error);
      return {
        title: fileName.replace(/\.epub$/i, ''),
        authors: ['Unknown Author'],
        pageCount: 0
      };
    }
  }

  async extractChunks(buffer: ArrayBuffer, bookId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    try {
      const book = ePub(buffer.slice(0));
      await book.ready;
      
      const spine = (book as any).spine;
      if (spine && spine.items) {
        const items = spine.items.slice(0, 50); // Process up to 50 spine items
        let chunkIndex = 1;

        for (const item of items) {
          try {
            await item.load(book.load.bind(book));
            const doc = item.document;
            if (doc) {
              const text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
              if (text.length > 50) {
                // Slice text into manageable 800 char chunks
                const paragraphs = text.split(/(?<=[.?!])\s+/);
                let currentChunkText = '';

                for (const para of paragraphs) {
                  if ((currentChunkText + ' ' + para).length > 800) {
                    if (currentChunkText.trim().length > 0) {
                      chunks.push({
                        id: `${bookId}_c${chunkIndex++}`,
                        bookId,
                        chapterTitle: item.idref || `Section ${chunkIndex}`,
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
                    id: `${bookId}_c${chunkIndex++}`,
                    bookId,
                    chapterTitle: item.idref || `Section ${chunkIndex}`,
                    text: currentChunkText.trim(),
                    tokenCount: currentChunkText.split(' ').length
                  });
                }
              }
            }
            item.unload();
          } catch (itemErr) {
            console.warn('Error extracting spine item:', itemErr);
          }
        }
      }
    } catch (err) {
      console.error('Error extracting EPUB chunks:', err);
    }
    return chunks;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
