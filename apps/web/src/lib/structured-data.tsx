import type { Server } from '@hypez/shared-types';

/**
 * Calculate rating from votes count
 * Uses a logarithmic scale to convert votes to 1-5 rating
 */
function calculateRating(votes: number): number {
    if (votes === 0) return 3.0;

    // Logarithmic scale: 1 vote = 3.0, 10 votes = 3.5, 100 votes = 4.0, 1000+ = 4.5-5.0
    const rating = 3.0 + Math.min(2.0, Math.log10(votes + 1) * 0.5);
    return Math.round(rating * 10) / 10; // Round to 1 decimal
}

/**
 * Generate Schema.org Organization structured data for a Discord server
 */
export function generateServerSchema(server: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    memberCount: number;
    votes: number;
    categories?: string[];
}) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hypez.live';
    const serverUrl = `${baseUrl}/server/${server.id}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: server.name,
        description: server.description || `Join ${server.name} Discord server with ${server.memberCount.toLocaleString()} members on Hypez`,
        url: serverUrl,
        logo: server.icon || undefined,

        // Aggregate rating based on votes
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: calculateRating(server.votes).toString(),
            reviewCount: server.votes,
            bestRating: '5',
            worstRating: '1',
        },

        // Member count as interaction statistic
        interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/JoinAction',
            userInteractionCount: server.memberCount,
        },

        // Categories as keywords
        keywords: server.categories?.join(', '),

        // Application category
        applicationCategory: 'Social Networking',

        // Platform
        operatingSystem: 'Discord',
    };
}

/**
 * Generate JSON-LD script tag for server page
 */
export function ServerStructuredData({ server }: { server: Parameters<typeof generateServerSchema>[0] }) {
    const schema = generateServerSchema(server);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                // Escape <, >, / so a server name like </script> can't break out of this tag
                __html: JSON.stringify(schema, null, 0)
                    .replace(/</g, '\\u003c')
                    .replace(/>/g, '\\u003e')
                    .replace(/\//g, '\\u002f'),
            }}
        />
    );
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate website structured data (for homepage)
 */
export function generateWebsiteSchema() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hypez.live';

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Hypez',
        description: 'The ultimate Discord server list and community directory',
        url: baseUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}
