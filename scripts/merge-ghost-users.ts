import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting ghost users merge migration...');
    const accounts = await prisma.account.findMany({
        where: { provider: 'discord' },
        select: { userId: true, providerAccountId: true }
    });

    console.log(`Found ${accounts.length} Discord accounts to check.`);

    let mergedCount = 0;

    for (const account of accounts) {
        const realUserId = account.userId;
        const ghostId = account.providerAccountId;

        if (realUserId === ghostId) continue;

        const ghostUser = await prisma.user.findUnique({
            where: { id: ghostId },
            include: { accounts: true }
        });

        // Eğer hayalet kullanıcı mevcutsa ve accounts tablosunda hiç kaydı yoksa (yani gerçek hesaba henüz merge edilmemişse)
        if (ghostUser && ghostUser.accounts.length === 0) {
            console.log(`Merging ghost user ${ghostId} into real user ${realUserId}...`);
            
            try {
                await prisma.$transaction(async (tx) => {
                    // 1. Oyları aktar
                    await tx.vote.updateMany({
                        where: { userId: ghostId },
                        data: { userId: realUserId }
                    });

                    // 2. Hype oylarını aktar
                    await tx.hypeVote.updateMany({
                        where: { userId: ghostId },
                        data: { userId: realUserId }
                    });

                    // 3. Beğenileri aktar (likedUser)
                    const liked = await tx.profileLike.findMany({ where: { userId: ghostId } });
                    for (const like of liked) {
                        const exists = await tx.profileLike.findUnique({
                            where: { userId_likerId: { userId: realUserId, likerId: like.likerId } }
                        });
                        if (exists) {
                            console.warn(`Skipped duplicate like: ${ghostId} → ${realUserId} (likerId: ${like.likerId})`);
                            await tx.profileLike.delete({ where: { id: like.id } });
                        } else {
                            await tx.profileLike.update({
                                where: { id: like.id },
                                data: { userId: realUserId }
                            });
                        }
                    }

                    // 4. Verilen beğenileri aktar (likerUser)
                    const given = await tx.profileLike.findMany({ where: { likerId: ghostId } });
                    for (const like of given) {
                        const exists = await tx.profileLike.findUnique({
                            where: { userId_likerId: { userId: like.userId, likerId: realUserId } }
                        });
                        if (exists) {
                            console.warn(`Skipped duplicate like: ${ghostId} → ${realUserId} (likedUserId: ${like.userId})`);
                            await tx.profileLike.delete({ where: { id: like.id } });
                        } else {
                            await tx.profileLike.update({
                                where: { id: like.id },
                                data: { likerId: realUserId }
                            });
                        }
                    }

                    // 5. Başvuruları aktar
                    await tx.application.updateMany({
                        where: { userId: ghostId },
                        data: { userId: realUserId }
                    });

                    // 6. Doğrulama oturumlarını aktar
                    await tx.verificationSession.updateMany({
                        where: { userId: ghostId },
                        data: { userId: realUserId }
                    });

                    // Silmeden önce kalan kayıtları kontrol et (Safety Checks)
                    const remainingVotes = await tx.vote.count({ where: { userId: ghostId } });
                    const remainingHype = await tx.hypeVote.count({ where: { userId: ghostId } });
                    if (remainingVotes > 0 || remainingHype > 0) {
                        throw new Error(`Migration incomplete for ghost user ${ghostId}. Votes: ${remainingVotes}, HypeVotes: ${remainingHype}. Aborting delete.`);
                    }

                    // 7. Ghost user'ı sil
                    await tx.user.delete({ where: { id: ghostId } });
                });
                mergedCount++;
                console.log(`[Success] Ghost user ${ghostId} merged successfully.`);
            } catch (err) {
                console.error(`[Error] Failed to merge ghost user ${ghostId} into ${realUserId}:`, err);
            }
        }
    }

    console.log(`Migration completed. Merged ${mergedCount} ghost users.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
