import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Helper to ensure connection string uses PgBouncer mode (required for Supabase Transaction Pooler)
const getConnectionString = () => {
    const url = process.env.DATABASE_URL;
    if (url && !url.includes('pgbouncer=true') && !url.includes('file:')) {
        return `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`;
    }
    return url;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: getConnectionString()
        }
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
