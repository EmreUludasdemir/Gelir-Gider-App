import { BadRequestException } from '@nestjs/common';

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv', 'text/plain'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

/**
 * File validation options
 */
export interface FileValidationOptions {
  allowedTypes: string[];
  maxSize: number; // in bytes
  required?: boolean;
}

/**
 * Default file validation options
 */
export const DEFAULT_PDF_OPTIONS: FileValidationOptions = {
  allowedTypes: [...ALLOWED_MIME_TYPES.pdf],
  maxSize: 10 * 1024 * 1024, // 10MB
  required: true,
};

export const DEFAULT_CSV_OPTIONS: FileValidationOptions = {
  allowedTypes: [...ALLOWED_MIME_TYPES.csv],
  maxSize: 5 * 1024 * 1024, // 5MB
  required: true,
};

/**
 * PDF file signature (magic bytes)
 * PDF files start with %PDF-
 */
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

/**
 * Validates file upload
 * @param file - The uploaded file
 * @param options - Validation options
 * @throws BadRequestException if validation fails
 */
export function validateFile(
  file: Express.Multer.File | undefined,
  options: FileValidationOptions = DEFAULT_PDF_OPTIONS,
): void {
  // Check if file is required
  if (!file) {
    if (options.required) {
      throw new BadRequestException({
        code: 'FILE_001',
        message: 'Dosya yüklenmedi',
        details: 'Lütfen bir dosya seçin',
      });
    }
    return;
  }

  // Check MIME type
  if (!options.allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException({
      code: 'FILE_002',
      message: 'Geçersiz dosya türü',
      details: `İzin verilen dosya türleri: ${options.allowedTypes.join(', ')}`,
      received: file.mimetype,
    });
  }

  // Check file size
  if (file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new BadRequestException({
      code: 'FILE_003',
      message: 'Dosya boyutu çok büyük',
      details: `Maksimum dosya boyutu: ${maxSizeMB}MB, Yüklenen: ${fileSizeMB}MB`,
    });
  }

  // Validate PDF magic bytes (for PDF files)
  if (options.allowedTypes.includes('application/pdf') && file.mimetype === 'application/pdf') {
    if (!validatePdfSignature(file.buffer)) {
      throw new BadRequestException({
        code: 'FILE_004',
        message: 'Geçersiz PDF dosyası',
        details: 'Dosya geçerli bir PDF formatında değil',
      });
    }
  }

  // Check for potentially dangerous file names
  if (hasDangerousFileName(file.originalname)) {
    throw new BadRequestException({
      code: 'FILE_005',
      message: 'Geçersiz dosya adı',
      details: 'Dosya adı geçersiz karakterler içeriyor',
    });
  }
}

/**
 * Validates PDF file signature (magic bytes)
 */
function validatePdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < PDF_SIGNATURE.length) {
    return false;
  }

  const fileSignature = buffer.subarray(0, PDF_SIGNATURE.length);
  return fileSignature.equals(PDF_SIGNATURE);
}

/**
 * Checks for potentially dangerous file names
 */
function hasDangerousFileName(filename: string): boolean {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return true;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return true;
  }

  // Check for overly long file names
  if (filename.length > 255) {
    return true;
  }

  // Check for double extensions that might bypass filters
  const dangerousPatterns = [
    /\.php\./i,
    /\.exe\./i,
    /\.sh\./i,
    /\.bat\./i,
    /\.cmd\./i,
    /\.js\./i,
    /\.vbs\./i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes a filename for safe storage
 */
export function sanitizeFileName(filename: string): string {
  // Remove path components
  const name = filename.split(/[/\\]/).pop() || 'file';

  // Replace dangerous characters
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 200);
}

/**
 * Generates a unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = sanitizeFileName(originalName.replace(/\.[^.]+$/, ''));

  return `${timestamp}_${random}_${baseName}.${extension}`;
}
