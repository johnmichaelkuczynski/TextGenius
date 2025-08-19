export class FileParser {
  static async parseFile(file: Buffer, filename: string): Promise<string> {
    if (!file || file.length === 0) {
      throw new Error('File is empty or corrupted');
    }

    const extension = filename.toLowerCase().split('.').pop();
    console.log('Parsing file:', { filename, extension, size: file.length });

    switch (extension) {
      case 'txt':
        const text = file.toString('utf-8');
        if (!text || text.trim().length === 0) {
          throw new Error('Text file appears to be empty');
        }
        return text;
      
      case 'pdf':
        throw new Error('PDF files are not supported yet. Please save your document as a .txt file or copy/paste the text directly.');
      
      case 'doc':
      case 'docx':
        throw new Error('Word documents are not supported yet. Please save your document as a .txt file or copy/paste the text directly.');
      
      default:
        throw new Error(`Unsupported file type: .${extension}. Please use .txt files or copy/paste your text directly.`);
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
