"use client";

import { useEffect, useState } from "react";

export function IntegrationTest() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("http://localhost:3001/api/servers")
            .then((res) => res.json())
            .then((data) => setData(data))
            .catch((err) => setError(err.message));
    }, []);

    if (error) return <div className="p-4 bg-red-900/50 text-red-200 rounded border border-red-500">API Error: {error}</div>;
    if (!data) return <div className="p-4 bg-blue-900/20 text-blue-200 animate-pulse">Loading API Data...</div>;

    return (
        <div className="p-4 bg-green-900/20 border border-green-500 rounded text-green-200 my-4">
            <h3 className="font-bold mb-2">✅ API Integration Active</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-black/50 p-2 rounded">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}
