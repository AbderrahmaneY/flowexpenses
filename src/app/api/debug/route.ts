import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const cwd = process.cwd();
        const prismaPath = path.join(cwd, 'prisma');
        const dbPath = path.join(prismaPath, 'dev.db');

        const info = {
            cwd,
            filesInCwd: fs.readdirSync(cwd),
            prismaDirExists: fs.existsSync(prismaPath),
            filesInPrisma: fs.existsSync(prismaPath) ? fs.readdirSync(prismaPath) : [],
            dbExists: fs.existsSync(dbPath),
            env: {
                DATABASE_URL: process.env.DATABASE_URL,
                NODE_ENV: process.env.NODE_ENV,
            }
        };

        return NextResponse.json(info);
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
