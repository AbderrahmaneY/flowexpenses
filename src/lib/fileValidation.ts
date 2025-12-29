// File signature validation (magic bytes)

const FILE_SIGNATURES: Record<string, { bytes: number[], extension: string }[]> = {
    'image/jpeg': [{ bytes: [0xFF, 0xD8, 0xFF], extension: 'jpg' }],
    'image/png': [{ bytes: [0x89, 0x50, 0x4E, 0x47], extension: 'png' }],
    'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46], extension: 'pdf' }],
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export async function validateUploadedFile(file: File): Promise<FileValidationResult> {
    // 1. Check MIME type header
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: `File type ${file.type} not allowed. Use PDF, JPG, or PNG.` };
    }

    // 2. Check file size
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large. Maximum size is 2MB.` };
    }

    // 3. Validate magic bytes (file signature)
    const magicValid = await validateMagicBytes(file);
    if (!magicValid) {
        return { valid: false, error: `File content doesn't match its extension. Possible tampering detected.` };
    }

    return { valid: true };
}

async function validateMagicBytes(file: File): Promise<boolean> {
    const signatures = FILE_SIGNATURES[file.type];
    if (!signatures) return false;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 8));

    for (const sig of signatures) {
        let match = true;
        for (let i = 0; i < sig.bytes.length; i++) {
            if (bytes[i] !== sig.bytes[i]) {
                match = false;
                break;
            }
        }
        if (match) return true;
    }

    return false;
}

export function generateSecureFilename(originalName: string): string {
    const crypto = require('crypto');
    const uuid = crypto.randomUUID();
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    // Only allow safe extensions
    const safeExt = ['jpg', 'jpeg', 'png', 'pdf'].includes(ext) ? ext : 'bin';
    return `${uuid}.${safeExt}`;
}

export { ALLOWED_TYPES, MAX_FILE_SIZE };
