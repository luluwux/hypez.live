import { useState, useMemo } from 'react';
import { Server } from '@/lib/api';

interface UseServerFilteringOptions {
    servers: Server[];
    selectedCategory: string;
    itemsPerPage?: number;
}

export function useServerFiltering({ servers, selectedCategory, itemsPerPage = 16 }: UseServerFilteringOptions) {
    const [currentPage, setCurrentPage] = useState(1);

    // Filter servers by category
    const filteredServers = useMemo(() => {
        if (selectedCategory === 'all') return servers;

        return servers.filter(server =>
            server.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase()) || false
        );
    }, [servers, selectedCategory]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredServers.length / itemsPerPage);

    const currentServers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredServers.slice(startIndex, endIndex);
    }, [filteredServers, currentPage, itemsPerPage]);

    // Handler for page changes
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);

            // Scroll to discover section
            const el = document.getElementById('discover');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    // Reset to page 1 when category changes
    const resetPage = () => setCurrentPage(1);

    return {
        filteredServers,
        currentServers,
        currentPage,
        totalPages,
        setCurrentPage,
        handlePageChange,
        resetPage,
    };
}
