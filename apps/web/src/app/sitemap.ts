import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hypez.live';

    try {
        // Fetch all servers with their update timestamps
        const servers = await prisma.server.findMany({
            select: {
                id: true,
                updatedAt: true,
            },
        });

        // Generate server URLs
        const serverUrls: MetadataRoute.Sitemap = servers.map((server: { id: string; updatedAt: Date }) => ({
            url: `${baseUrl}/servers/${server.id}`,
            lastModified: server.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        }));

        // Static pages
        const staticPages: MetadataRoute.Sitemap = [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            },
            {
                url: `${baseUrl}/servers`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            },
            {
                url: `${baseUrl}/top`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            },
            {
                url: `${baseUrl}/premium`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            },
            {
                url: `${baseUrl}/legal/privacy`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.3,
            },
            {
                url: `${baseUrl}/legal/cookie`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.3,
            },
            {
                url: `${baseUrl}/legal/content-policy`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.3,
            },
        ];

        return [...staticPages, ...serverUrls];
    } catch (error) {
        console.error('Sitemap generation error:', error);

        // Return minimal sitemap on error
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            },
        ];
    } finally {
        await prisma.$disconnect();
    }
}
