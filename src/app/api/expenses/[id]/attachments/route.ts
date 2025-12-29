import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (increased from 500KB)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Magic byte signatures for file validation
const FILE_SIGNATURES: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

async function validateMagicBytes(file: File): Promise<boolean> {
    const signature = FILE_SIGNATURES[file.type];
    if (!signature) return false;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 8));

    for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) return false;
    }
    return true;
}

function generateSecureFilename(originalName: string): string {
    const uuid = crypto.randomUUID();
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const safeExt = ['jpg', 'jpeg', 'png', 'pdf'].includes(ext) ? ext : 'bin';
    return `${uuid}.${safeExt}`;
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block if user must change password
    if (session.mustChangePassword) {
        return NextResponse.json({ error: 'Must change password first' }, { status: 403 });
    }

    const params = await props.params;
    const expenseId = parseInt(params.id);
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
        // 1. Validate file size (2MB)
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: File too large (max 2MB)`);
            continue;
        }

        // 2. Validate MIME type
        if (!ALLOWED_TYPES.includes(file.type)) {
            errors.push(`${file.name}: Invalid file type. Use PDF, JPG, or PNG.`);
            continue;
        }

        // 3. Validate magic bytes (content signature)
        const isValidContent = await validateMagicBytes(file);
        if (!isValidContent) {
            errors.push(`${file.name}: File content doesn't match type. Possible tampering.`);
            continue;
        }

        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create upload directory
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(expenseId));
            await mkdir(uploadDir, { recursive: true });

            // Generate secure UUID filename (never use original name in path)
            const secureFileName = generateSecureFilename(file.name);
            const filePath = path.join(uploadDir, secureFileName);
            await writeFile(filePath, buffer);

            // Save to database (store original name for display, secure name for path)
            const attachment = await prisma.attachment.create({
                data: {
                    expenseReportId: expenseId,
                    fileName: file.name,  // Original name for display only
                    filePath: `/uploads/${expenseId}/${secureFileName}`,  // Secure UUID path
                    fileType: file.type,
                    fileSize: file.size,
                },
            });

            uploadedFiles.push(attachment);
        } catch (error) {
            console.error('Upload error for file:', file.name, error);
            errors.push(`${file.name}: Upload failed`);
        }
    }

    return NextResponse.json({
        uploaded: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
    });
}

