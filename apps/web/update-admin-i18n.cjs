const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Lulushu/Desktop/Serverlist/luppux/apps/web/src/lib/i18n/translations';
const enPath = path.join(dir, 'en.json');
const trPath = path.join(dir, 'tr.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));

const adminExtraEN = {
    standardServers: "Standard Servers",
    premiumServers: "Premium Servers",
    tokenServers: "Token Servers",
    loading: "Loading...",
    lastUpdated: "Last updated:",
    noData: "No data",
    refresh: "Refresh",
    tryAgain: "Try Again",
    serverGrowth: "Server Growth",
    serverDistribution: "Server Distribution",
    recentActivity: "Recent Activity",
    adminActions: "Recent actions by administrators"
};

const adminExtraTR = {
    standardServers: "Standart Sunucular",
    premiumServers: "Premium Sunucular",
    tokenServers: "Token Sunucular",
    loading: "Yükleniyor...",
    lastUpdated: "Son güncellenme:",
    noData: "Veri yok",
    refresh: "Yenile",
    tryAgain: "Tekrar Dene",
    serverGrowth: "Sunucu Büyümesi",
    serverDistribution: "Sunucu Dağılımı",
    recentActivity: "Son İşlemler",
    adminActions: "Yöneticiler tarafından gerçekleştirilen son eylemler"
};

enData.admin = { ...enData.admin, ...adminExtraEN };
trData.admin = { ...trData.admin, ...adminExtraTR };

fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));

console.log("Updated admin keys in en and tr");
