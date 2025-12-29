'use client';

import { useEffect, useState } from 'react';

export default function SecurityBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Show banner in production when not using HTTPS
        const isProduction = process.env.NODE_ENV === 'production';
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const showBanner = process.env.NEXT_PUBLIC_SHOW_PILOT_BANNER === 'true';

        if ((isProduction && !isHttps) || showBanner) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="bg-amber-500 text-amber-900 text-center py-2 px-4 text-sm font-medium">
            ⚠️ Internal Pilot – Do not upload sensitive documents. HTTPS not enabled.
        </div>
    );
}
