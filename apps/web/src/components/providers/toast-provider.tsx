'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                style: {
                    background: '#18181b',
                    border: '1px solid #27272a',
                    color: '#fafafa',
                },
                className: 'font-sans',
            }}
            theme="dark"
        />
    );
}
