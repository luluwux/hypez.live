import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
    { name: 'Gaming', slug: 'gaming', emoji: '🎮', color: '#6366f1', sortOrder: 0 },
    { name: 'Anime', slug: 'anime', emoji: '🎌', color: '#ec4899', sortOrder: 1 },
    { name: 'Public', slug: 'public', emoji: '🌐', color: '#3b82f6', sortOrder: 2 },
    { name: 'Community', slug: 'community', emoji: '👥', color: '#10b981', sortOrder: 3 },
    { name: 'Music', slug: 'music', emoji: '🎵', color: '#f59e0b', sortOrder: 4 },
    { name: 'Art', slug: 'art', emoji: '🎨', color: '#ec4899', sortOrder: 5 },
    { name: 'Design', slug: 'design', emoji: '✏️', color: '#8b5cf6', sortOrder: 6 },
    { name: 'Programming', slug: 'programming', emoji: '💻', color: '#06b6d4', sortOrder: 7 },
    { name: 'Science', slug: 'science', emoji: '🔬', color: '#14b8a6', sortOrder: 8 },
    { name: 'Technology', slug: 'technology', emoji: '⚡', color: '#f97316', sortOrder: 9 },
    { name: 'Education', slug: 'education', emoji: '📚', color: '#3b82f6', sortOrder: 10 },
    { name: 'Chill', slug: 'chill', emoji: '😌', color: '#10b981', sortOrder: 11 },
    { name: 'Roleplay', slug: 'roleplay', emoji: '🎭', color: '#8b5cf6', sortOrder: 12 },
    { name: 'Crypto', slug: 'crypto', emoji: '📈', color: '#f59e0b', sortOrder: 13 },
    { name: 'Creators', slug: 'creators', emoji: '🎬', color: '#ef4444', sortOrder: 14 },
    { name: 'Other', slug: 'other', emoji: '💫', color: '#6366f1', sortOrder: 15 },
];

async function main() {
    console.log('Seeding categories...');

    for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
        console.log(`  ✓ ${cat.emoji} ${cat.name}`);
    }

    console.log(`\nSeeded ${DEFAULT_CATEGORIES.length} categories.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
