const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Lulushu/Desktop/Serverlist/luppux/apps/web/src/lib/i18n/translations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const translations = {
  en: {
    membersCount: "{count} members",
    trustedBy: "✨ Trusted by {count} Members",
    spotAvailable: "Spot Available",
    useHypeToRank: "Use /hype to rank",
    trendingServers: "Trending Servers",
    newlyAdded: "Newly Added",
    topServers: "Top Servers"
  },
  tr: {
    membersCount: "{count} üye",
    trustedBy: "✨ {count} Üye Tarafından Güveniliyor",
    spotAvailable: "Boş Alan",
    useHypeToRank: "Sıralama için /hype kullanın",
    trendingServers: "Popüler Sunucular",
    newlyAdded: "Yeni Eklenenler",
    topServers: "En İyi Sunucular"
  },
  fr: {
    membersCount: "{count} membres",
    trustedBy: "✨ Approuvé par {count} Membres",
    spotAvailable: "Place Disponible",
    useHypeToRank: "Utilisez /hype pour vous classer",
    trendingServers: "Serveurs Tendances",
    newlyAdded: "Récemment Ajoutés",
    topServers: "Meilleurs Serveurs"
  },
  es: {
    membersCount: "{count} miembros",
    trustedBy: "✨ Confiado por {count} Miembros",
    spotAvailable: "Espacio Disponible",
    useHypeToRank: "Usa /hype para clasificar",
    trendingServers: "Servidores en Tendencia",
    newlyAdded: "Recién Agregados",
    topServers: "Mejores Servidores"
  },
  ru: {
    membersCount: "{count} участников",
    trustedBy: "✨ Доверяют {count} Участников",
    spotAvailable: "Свободное Место",
    useHypeToRank: "Используйте /hype для рейтинга",
    trendingServers: "Популярные Серверы",
    newlyAdded: "Недавно Добавленные",
    topServers: "Лучшие Серверы"
  },
  zh: {
    membersCount: "{count} 名成员",
    trustedBy: "✨ 深受 {count} 名成员信任",
    spotAvailable: "可用位置",
    useHypeToRank: "使用 /hype 进行排名",
    trendingServers: "热门服务器",
    newlyAdded: "最新添加",
    topServers: "顶级服务器"
  },
  pt: {
    membersCount: "{count} membros",
    trustedBy: "✨ Confiado por {count} Membros",
    spotAvailable: "Vaga Disponível",
    useHypeToRank: "Use /hype para classificar",
    trendingServers: "Servidores em Alta",
    newlyAdded: "Recém Adicionados",
    topServers: "Principais Servidores"
  },
  ar: {
    membersCount: "{count} عضو",
    trustedBy: "✨ موثوق به من قبل {count} عضو",
    spotAvailable: "مكان متاح",
    useHypeToRank: "استخدم /hype للترتيب",
    trendingServers: "الخوادم الشائعة",
    newlyAdded: "مضاف حديثاً",
    topServers: "أفضل الخوادم"
  },
  hi: {
    membersCount: "{count} सदस्य",
    trustedBy: "✨ {count} सदस्यों द्वारा विश्वसनीय",
    spotAvailable: "स्थान उपलब्ध",
    useHypeToRank: "रैंक के लिए /hype का उपयोग करें",
    trendingServers: "ट्रेंडिंग सर्वर",
    newlyAdded: "हाल ही में जोड़े गए",
    topServers: "शीर्ष सर्वर"
  },
  bn: {
    membersCount: "{count} সদস্য",
    trustedBy: "✨ {count} সদস্য দ্বারা বিশ্বস্ত",
    spotAvailable: "স্থান উপলব্ধ",
    useHypeToRank: "র‍্যাঙ্ক করতে /hype ব্যবহার করুন",
    trendingServers: "ট্রেন্ডিং সার্ভার",
    newlyAdded: "সম্প্রতি যোগ করা হয়েছে",
    topServers: "শীর্ষ সার্ভার"
  }
};

const adminTranslations = {
  en: {
    dashboard: "Dashboard",
    servers: "Servers",
    users: "Users",
    settings: "Settings",
    logout: "Log Out",
    overview: "Overview",
    totalServers: "Total Servers",
    totalUsers: "Total Users",
    activeBoosts: "Active Boosts",
    revenue: "Revenue",
    flaggedServers: "Flagged Servers",
    botSettings: "Bot Settings",
    welcome: "Welcome back, Admin!",
    manageSystem: "Manage system settings and content",
    viewAll: "View All",
    recentServers: "Recent Servers",
    recentUsers: "Recent Users"
  },
  tr: {
    dashboard: "Kontrol Paneli",
    servers: "Sunucular",
    users: "Kullanıcılar",
    settings: "Ayarlar",
    logout: "Çıkış Yap",
    overview: "Genel Bakış",
    totalServers: "Toplam Sunucu",
    totalUsers: "Toplam Kullanıcı",
    activeBoosts: "Aktif Boost",
    revenue: "Gelir",
    flaggedServers: "Şüpheli Sunucular",
    botSettings: "Bot Ayarları",
    welcome: "Hoş geldin, Yönetici!",
    manageSystem: "Sistem ayarlarını ve içeriği yönetin",
    viewAll: "Tümünü Gör",
    recentServers: "Son Sunucular",
    recentUsers: "Son Kullanıcılar"
  }
};

for (const file of files) {
  const lang = file.replace('.json', '');
  const filePath = path.join(dir, file);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add common keys
    if (!data.common) data.common = {};
    if (translations[lang]) {
        data.common.membersCount = translations[lang].membersCount;
    } else {
        data.common.membersCount = translations.en.membersCount;
    }
    
    // Add home keys
    if (!data.home) data.home = {};
    if (translations[lang]) {
        data.home.trustedBy = translations[lang].trustedBy;
        data.home.spotAvailable = translations[lang].spotAvailable;
        data.home.useHypeToRank = translations[lang].useHypeToRank;
        data.home.trendingServers = translations[lang].trendingServers;
        data.home.newlyAdded = translations[lang].newlyAdded;
        data.home.topServers = translations[lang].topServers;
    } else {
        data.home.trustedBy = translations.en.trustedBy;
        data.home.spotAvailable = translations.en.spotAvailable;
        data.home.useHypeToRank = translations.en.useHypeToRank;
        data.home.trendingServers = translations.en.trendingServers;
        data.home.newlyAdded = translations.en.newlyAdded;
        data.home.topServers = translations.en.topServers;
    }
    
    // Add admin keys (only EN and TR)
    if (lang === 'en' || lang === 'tr') {
        data.admin = adminTranslations[lang];
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    console.log(`Updated ${file}`);
  } catch (err) {
    console.error(`Error updating ${file}:`, err);
  }
}
