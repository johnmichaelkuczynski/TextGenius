export class FileParser {
  static async parseFile(file: Buffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'txt':
        return file.toString('utf-8');
      
      case 'pdf':
        // For now, return an error message since we can't include PDF parsing libraries
        throw new Error('PDF parsing not implemented yet. Please use TXT files or copy/paste content.');
      
      case 'doc':
      case 'docx':
        // For now, return an error message since we can't include Word parsing libraries
        throw new Error('Word document parsing not implemented yet. Please use TXT files or copy/paste content.');
      
      default:
        throw new Error('Unsupported file type. Please use TXT, DOC, DOCX, or PDF files.');
    }
  }

  static validateFileType(filename: string): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return ['txt', 'doc', 'docx', 'pdf'].includes(extension || '');
  }

  static getFileSize(file: Buffer): number {
    return file.length;
  }
}
