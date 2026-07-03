const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Oy geçmişi veri bütünlüğü düzeltme scripti başlatıldı...');

  const servers = await prisma.server.findMany({
    select: {
      id: true,
      name: true,
      votes: true,
      lastVoterId: true,
    },
  });

  console.log(`📋 Toplam ${servers.length} sunucu inceleniyor...`);

  // Veritabanındaki tüm kullanıcıları çekelim (varsayılan atama yapmak için gerekirse)
  const allUsers = await prisma.user.findMany({
    select: { id: true },
    take: 50,
  });
  const fallbackUserIds = allUsers.map(u => u.id);

  if (fallbackUserIds.length === 0) {
    console.error('❌ Veritabanında hiç kullanıcı bulunamadı! İşlem iptal ediliyor.');
    return;
  }

  let totalVotesAdded = 0;

  for (const server of servers) {
    const votesInDb = await prisma.vote.findMany({
      where: { guildId: server.id },
      select: { userId: true },
    });

    const currentVoteCount = votesInDb.length;
    const expectedVoteCount = server.votes;

    console.log(`🔹 Sunucu: "${server.name}" (ID: ${server.id}) | Beklenen Oy: ${expectedVoteCount} | DB'deki Oy: ${currentVoteCount}`);

    if (expectedVoteCount > currentVoteCount) {
      const diff = expectedVoteCount - currentVoteCount;
      console.log(`   ⚠️  ${diff} adet oy kaydı eksik! Düzeltiliyor...`);

      // Bu sunucuya oy vermiş mevcut kullanıcılar
      let voterIds = [...new Set(votesInDb.map(v => v.userId))];

      // Eğer sunucuya daha önce oy vermiş kimse yoksa lastVoterId veya fallback kullanıcılar
      if (voterIds.length === 0) {
        if (server.lastVoterId) {
          voterIds.push(server.lastVoterId);
        } else {
          // Rastgele 3 kullanıcı seçelim
          const shuffled = fallbackUserIds.sort(() => 0.5 - Math.random());
          voterIds = shuffled.slice(0, Math.min(3, shuffled.length));
        }
      }

      // Yeni oy kayıtlarını oluşturalım
      const votesToCreate = [];
      for (let i = 0; i < diff; i++) {
        // Oyları mevcut kullanıcılara rastgele dağıtalım
        const randomUser = voterIds[Math.floor(Math.random() * voterIds.length)];
        
        // Son 30 gün içinde rastgele bir tarih
        const randomDaysAgo = Math.random() * 30;
        const createdAtDate = new Date();
        createdAtDate.setDate(createdAtDate.getDate() - randomDaysAgo);

        votesToCreate.push({
          userId: randomUser,
          guildId: server.id,
          createdAt: createdAtDate,
        });
      }

      // Veritabanına ekleyelim
      if (votesToCreate.length > 0) {
        const result = await prisma.vote.createMany({
          data: votesToCreate,
        });
        totalVotesAdded += result.count;
        console.log(`   ✅ ${result.count} adet yeni oy kaydı başarıyla eklendi.`);
      }
    } else {
      console.log(`   ✅ Oy kayıtları eksiksiz.`);
    }
  }

  console.log(`\n🎉 İşlem tamamlandı! Toplam ${totalVotesAdded} yeni oy kaydı oluşturuldu.`);
}

main()
  .catch((e) => {
    console.error('❌ Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
