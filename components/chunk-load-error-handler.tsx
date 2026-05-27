'use client';

import { useEffect } from 'react';

export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event?.message || '';
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        // Avoid infinite reload loop
        const key = 'chunk_reload_ts';
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (last && now - parseInt(last, 10) < 10000) {
          // Already reloaded recently, don't loop
          return;
        }
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg = reason?.message || reason?.toString?.() || '';
      if (
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('Loading CSS chunk') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        const key = 'chunk_reload_ts';
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (last && now - parseInt(last, 10) < 10000) {
          return;
        }
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    };

    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return null;
}
