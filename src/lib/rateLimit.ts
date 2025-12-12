// Simple in-memory rate limiter for internal pilot
// For production, use Redis-based rate limiting

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Clean up or create new entry
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
    }

    entry.count++;

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);

    return { allowed, remaining, resetIn };
}

// Predefined limits
export const RATE_LIMITS = {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 attempts per 15 min
    approvalAction: { windowMs: 60 * 1000, maxRequests: 30 },  // 30 per minute
    dataApi: { windowMs: 60 * 1000, maxRequests: 60 }  // 60 per minute
};

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
