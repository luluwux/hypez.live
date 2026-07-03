const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Snowflake -> CUID Oy & Hype Migration Scripti Başlatıldı...');

  // 1. Tüm discord hesaplarını çekelim
  const accounts = await prisma.account.findMany({
    where: { provider: 'discord' },
    select: {
      userId: true,          // cuid
      providerAccountId: true // snowflake
    }
  });

  console.log(`📋 Toplam ${accounts.length} Discord-Web hesap eşleşmesi bulundu.`);

  let updatedVotes = 0;
  let updatedHypes = 0;

  for (const account of accounts) {
    const cuid = account.userId;
    const snowflake = account.providerAccountId;

    // Vote tablosundaki bu snowflake oylarını cuid'ye bağlayalım
    const voteResult = await prisma.vote.updateMany({
      where: { userId: snowflake },
      data: { userId: cuid }
    });

    if (voteResult.count > 0) {
      console.log(`   🗳️  User ${snowflake} -> ${cuid}: ${voteResult.count} oy güncellendi.`);
      updatedVotes += voteResult.count;
    }

    // HypeVote tablosundaki bu snowflake hypelarını cuid'ye bağlayalım
    const hypeResult = await prisma.hypeVote.updateMany({
      where: { userId: snowflake },
      data: { userId: cuid }
    });

    if (hypeResult.count > 0) {
      console.log(`   ⚡ User ${snowflake} -> ${cuid}: ${hypeResult.count} hype güncellendi.`);
      updatedHypes += hypeResult.count;
    }
  }

  console.log(`\n🎉 Migration Tamamlandı!`);
  console.log(`   - Toplam Güncellenen Oy Kaydı: ${updatedVotes}`);
  console.log(`   - Toplam Güncellenen Hype Kaydı: ${updatedHypes}`);
}

main()
  .catch((e) => {
    console.error('❌ Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
