import { Injectable, inject } from '@angular/core';
import { DocumentProcessor } from './document-processor.interface';
import { PdfProcessorService } from './pdf-processor.service';
import { EpubProcessorService } from './epub-processor.service';
import { FileType } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentProcessorFactory {
  private pdfProcessor = inject(PdfProcessorService);
  private epubProcessor = inject(EpubProcessorService);

  getProcessorForFile(file: File): DocumentProcessor | null {
    if (this.pdfProcessor.canProcess(file)) {
      return this.pdfProcessor;
    }
    if (this.epubProcessor.canProcess(file)) {
      return this.epubProcessor;
    }
    return null;
  }

  getProcessorForType(type: FileType): DocumentProcessor {
    if (type === 'pdf') return this.pdfProcessor;
    return this.epubProcessor;
  }
}
