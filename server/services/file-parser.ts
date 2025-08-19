import mammoth from 'mammoth';

export class FileParser {
  static async parseFile(file: Buffer, filename: string): Promise<string> {
    if (!file || file.length === 0) {
      throw new Error('File is empty or corrupted');
    }

    const extension = filename.toLowerCase().split('.').pop();
    console.log('Parsing file:', { filename, extension, size: file.length });

    if (!extension) {
      throw new Error('File has no extension. Please use TXT, DOC, DOCX, or PDF files.');
    }

    try {
      switch (extension) {
        case 'txt':
          const text = file.toString('utf-8');
          if (!text || text.trim().length === 0) {
            throw new Error('Text file appears to be empty');
          }
          return text;
        
        case 'pdf':
          // PDF parsing will be implemented in a future update
          throw new Error('PDF files require specialized processing. Please convert your PDF to a Word document (.docx) or copy/paste the text directly for now.');
        
        case 'doc':
        case 'docx':
          console.log('Parsing Word document...');
          const result = await mammoth.extractRawText({ buffer: file });
          if (!result.value || result.value.trim().length === 0) {
            throw new Error('Word document appears to be empty or contains no readable text');
          }
          return result.value;
        
        default:
          throw new Error(`Unsupported file type: .${extension}. Please use TXT, DOC, or DOCX files.`);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to parse ${extension.toUpperCase()} file: ${error}`);
    }
  }

  static validateFileType(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return ['txt', 'doc', 'docx'].includes(extension || '');
  }

  static getFileSize(file: Buffer): number {
    return file.length;
  }
}
