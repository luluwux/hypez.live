import path from 'path';
import fs from 'fs';

const locales: Record<string, any> = {
    en: {
        // General & Errors
        'rate_limit': 'This server is sending too many requests. Please wait a moment.',
        'system_error': '❌ An unexpected system error occurred. Please try again.',
        'common.no_permission': '❌ You do not have permission to use this command.',
        'common.admin_only': '❌ You need the **ADMINISTRATOR** permission to use this command.',
        'common.owner_only': '❌ Only the **Bot Owner** can use this command.',
        'common.server_not_registered': '❌ Server is not registered. Please wait until bot sync runs.',
        'common.not_in_guild': '❌ This command can only be used in a server.',
        'common.invalid_channel': '❌ Please select a valid **text channel**.',
        'common.no_send_permission': '❌ I do not have permission to send messages in that channel.',

        // Vote Command
        'vote.verification.title': '🛡️ Hypez Shield Verification',
        'vote.verification.description': 'Select the correct code from the options below to verify your vote.',
        'vote.verification.footer': 'Hypez Shield • Anti-Bot Protection',
        'vote.success': '✅ **Verification Successful!**\nVote cast for **{serverName}**.\nTotal Votes: **{votes}**',
        'vote.timeout.title': '⏱️ Timeout',
        'vote.timeout.description': 'You took too long to respond. Please try voting again.',
        'vote.failed': '❌ Verification failed. Please try again.',
        'vote.cooldown.title': '⏳ Cooldown Active',
        'vote.cooldown.description': 'You already voted for this server. You can vote again {time}.',
        'vote.wrong.title': '❌ Wrong Answer',
        'vote.wrong.description': 'Incorrect captcha answer. Please try again.',
        'vote.error.title': '❌ Error',
        'vote.error.description': 'An unexpected error occurred. Please try again later.',
        'vote.error.owner': '❌ Server owners cannot vote for their own server!',
        'vote.owner.bypass': '⚡ **Owner mode** — cooldown bypassed.',
        'vote.owner.note': 'Vote cooldowns do not apply to the bot owner.',

        // Captcha system
        'captcha.timeout.title': '❌ Timed Out',
        'captcha.timeout.body': 'Captcha timed out. Try again.',
        'captcha.wrong.title': '❌ Wrong Answer',
        'captcha.wrong.body': 'Incorrect captcha answer. Please try again with {command}.',
        'captcha.ratelimit': 'Too many captcha attempts. Try again in 5 minutes.',
        'captcha.lockout': 'Too many wrong attempts. Try again in 1 hour.',

        // Hype Flow
        'hype.cooldown': '### ⏳ Hype Cooldown\n{message}',
        'hype.not_found': '### ❌ Not Found\nThis server is not registered on Hypez. Use `/setup` first.',
        'hype.error': '### ❌ Error\nFailed to record hype. Please try again.',
        'hype.error.owner': '❌ Server owners cannot hype their own server!',
        'hype.embed.title': '🔥 Hype Verification',
        'hype.embed.desc': '**Server:** {serverName}\n**Points to award:** ~{points} pts\n\nSolve the captcha below to confirm your Hype!',
        'hype.embed.footer': 'Hypez • Hype System — 40 second timeout',
        'hype.success.title': '✅ Hype Successful!',
        'hype.success.body': 'You\'ve Hyped **{serverName}**!\n\n**Points Awarded:** +{points}\n**Weekly Hypes Remaining:** {remaining}/{total}\n{nextAvailable}',
        'hype.success.next_available': '\n**Next Hype Available:** {time}',
        'hype.success.weekly_limit': '\n**Weekly limit reached! Resets next Monday.**',

        // Settings Command
        'settings.title': '⚙️ Server Settings',
        'settings.description': 'Configure your server\'s language and categories.',
        'settings.language.label': 'Current Language',
        'settings.categories.label': 'Categories',
        'settings.language.button': 'Language',
        'settings.categories.button': 'Categories',
        'settings.language.select': '**Select your server language:**',
        'settings.categories.select': '**Select your server categories** (up to 2):',
        'settings.language.updated': '✅ **Language updated!** {flag} **{name}**',
        'settings.categories.updated': '✅ **Categories updated!**\n{categories}',
        'settings.no.categories': '*No categories set*',
        'settings.footer': 'Hypez • Server Configuration',
        'settings.error': '❌ An error occurred while updating settings.',
        'settings.permission.denied': '❌ You need Administrator permissions to use this command.',
        
        // Settings v2 additions
        'settings.invite_url.label': 'Invite Link',
        'settings.not_set_invite': '*Not set — configure with /setinvite*',
        'settings.info': '*ℹ️ Info: Categories are visible in search filters and website. You can select up to 3 categories. **Invite link is mandatory** — configure with \`/setinvite\`.*',
        'settings.button.lang': 'Change Language',
        'settings.button.cats': 'Select Categories',
        'settings.categories.placeholder': 'Select categories (up to 3)',
        'settings.language.placeholder': 'Select language',
        'settings.categories.title': '📂 **Select Categories**\nCategories this server will list under (up to 3):',
        'settings.categories.updated.info': '✅ Categories saved: {catNames}\n\n*Your server will list under these categories on the website.*',
        'settings.categories.error': '❌ Error occurred while saving categories.',
        'settings.language.error': '❌ Error occurred while updating language.',
        'settings.not_selected': '*Not selected yet*',

        // Ping Command
        'ping.response': '🏓 Pong!\n**Bot Latency:** `{latency}ms`\n**Discord API Latency:** `{apiLatency}ms`',

        // Premium Command
        'premium.title': 'Premium Status — {serverName}',
        'premium.tier.token': '🔷 TOKEN',
        'premium.tier.premium': '⭐ PREMIUM',
        'premium.tier.free': '⚪ FREE',
        'premium.expires': 'Expires',
        'premium.permanent': '**Permanent**',
        'premium.votes': 'Votes',
        'premium.weekly_hype': 'Weekly Hype',
        'premium.desc.free': '🔓 This server is on the **Free** tier.\n\nUpgrade to Premium to unlock:\n• Highlighted listing\n• Faster bump (every 2h)\n• 2x vote power\n• Animated banner\n• Priority support\n\nVisit https://hypez.live/premium to upgrade!',
        'premium.desc.token': '🔷 This server has the **TOKEN** badge — a special recognition tier.\nEnjoy all premium benefits plus exclusive Token perks.',
        'premium.desc.premium': '⭐ This server is on the **Premium** tier.\nEnjoy highlighted listing, faster bumps, and priority support!',
        'premium.failed': '❌ Failed to fetch premium status.',

        // Say Command
        'say.stats.title': '📊 Server Statistics — {serverName}',
        'say.stats.members': 'Total Members',
        'say.stats.active': 'Active Members',
        'say.stats.votes': 'Total Votes',
        'say.stats.boosts': 'Boost Count',
        'say.failed': '❌ Failed to fetch server statistics.',

        // Setinvite Command
        'setinvite.no_channel': '❌ Failed to find a suitable channel to create an invite. Please specify a link manually: `/setinvite link:discord.gg/yourcode`',
        'setinvite.invalid_format': '❌ Invalid invite link. Please enter in `discord.gg/yourcode` or `https://discord.gg/yourcode` format.',
        'setinvite.created.title': '✅ Invite Link Created',
        'setinvite.updated.title': '✅ Invite Link Updated',
        'setinvite.body': 'Invite link saved for **{serverName}**.\n\n🔗 **Link:** {inviteUrl}\n🌐 **Server Page:** {webUrl}/servers/{guildId}',
        'setinvite.open_discord': 'Open in Discord',
        'setinvite.view_server': 'View Server',

        // Setup Apps Command
        'setup_apps.title': 'APPLICATION CENTER',
        'setup_apps.body': 'Please select the type of application you want to submit from the menu below.\n\n**🌟 Streamer Application:** Apply if you are actively streaming and have an audience.\n**✅ Verified Server:** Get the Verified Server badge if your server meets certain conditions.\n**🤝 Partnership:** Use this option if you plan a long-term partnership with our system.',
        'setup_apps.placeholder': 'Select Application Type',
        'setup_apps.streamer.label': 'Streamer Application',
        'setup_apps.streamer.desc': 'Special application form for streamers',
        'setup_apps.verified.label': 'Verified Server Application',
        'setup_apps.verified.desc': 'Apply to become a verified server',
        'setup_apps.partner.label': 'Partnership Application',
        'setup_apps.partner.desc': 'Apply to partner with us',
        'setup_apps.invalid_channel': 'Invalid channel type.',
        'setup_apps.success_message': '✅ Application message successfully sent to the channel!',
        'setup_apps.error_prefix': '❌ Error occurred:',

        // Applications Modal submit
        'application.modal.title': 'Application Form',
        'application.fields.server_id.label': 'Server ID (If any)',
        'application.fields.reason.label': 'Why are you applying? / Explanation',
        'application.fields.reason.placeholder': 'Please introduce yourself and your server...',
        'application.submit.success': '✅ Your application has been successfully received. Our management team will review it as soon as possible.',
        'application.submit.error': '❌ An error occurred while saving your application.',

        // Setup Command Board
        'setup.board.desc': 'We are at **#{rank}** this month with **{votes} Votes** and **{hype} Hype**! Don\'t forget to support us on Hypez. You can contribute to our rankings by voting, and help us enter this week\'s Trending list by Hyping. Thank you for your support!',
        'setup.board.vote_btn': 'Vote',
        'setup.board.view_btn': 'View Server',
        'setup.board.last_vote': '-# 🗳️ Last vote: **{username}** · {time}',
        'setup.board.no_votes': '-# *No votes yet*',
        'setup.board.setup_time': '-# 🕒 Setup: {relative} · {full}',
        'setup.no_data': 'No data available yet.'
    },
    tr: {
        // General & Errors
        'rate_limit': 'Bu sunucu çok fazla istek gönderiyor. Lütfen biraz bekleyin.',
        'system_error': '❌ Beklenmedik bir sistem hatası oluştu. Lütfen tekrar deneyin.',
        'common.no_permission': '❌ Bu komutu kullanmak için yetkiniz yok.',
        'common.admin_only': '❌ Bu komutu kullanmak için **YÖNETİCİ** yetkisine sahip olmalısın.',
        'common.owner_only': '❌ Bu komutu sadece **Bot Sahibi** kullanabilir.',
        'common.server_not_registered': '❌ Sunucu kayıtlı değil. Lütfen bot sync çalışana kadar bekleyin.',
        'common.not_in_guild': '❌ Bu komut sadece sunucularda kullanılabilir.',
        'common.invalid_channel': '❌ Lütfen geçerli bir **metin kanalı** seçin.',
        'common.no_send_permission': '❌ Bu kanala mesaj göndermek için iznim bulunmuyor.',

        // Vote Komutu
        'vote.verification.title': '🛡️ Hypez Shield Doğrulama',
        'vote.verification.description': 'Oyunu doğrulamak için aşağıdaki seçeneklerden doğru kodu seçin.',
        'vote.verification.footer': 'Hypez Shield • Bot Koruması',
        'vote.success': '✅ **Doğrulama Başarılı!**\n**{serverName}** için oy verildi.\nToplam Oy: **{votes}**',
        'vote.timeout.title': '⏱️ Zaman Aşımı',
        'vote.timeout.description': 'Yanıt vermek için çok uzun süre geçti. Lütfen tekrar oy vermeyi deneyin.',
        'vote.failed': '❌ Doğrulama başarısız. Lütfen tekrar deneyin.',
        'vote.cooldown.title': '⏳ Bekleme Süresi Aktif',
        'vote.cooldown.description': 'Bu sunucu için zaten oy verdiniz. {time} tekrar oy verebilirsiniz.',
        'vote.wrong.title': '❌ Yanlış Cevap',
        'vote.wrong.description': 'Captcha cevabı yanlış. Lütfen tekrar deneyin.',
        'vote.error.title': '❌ Hata',
        'vote.error.description': 'Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        'vote.error.owner': '❌ Sunucu sahipleri kendi sunucularına oy veremez!',
        'vote.owner.bypass': '⚡ **Sahip modu** — bekleme süresi atlandı.',
        'vote.owner.note': 'Bot sahibi için oy bekleme süresi geçerli değildir.',

        // Captcha sistemi
        'captcha.timeout.title': '❌ Süre Doldu',
        'captcha.timeout.body': 'Captcha süresi doldu. Tekrar dene.',
        'captcha.wrong.title': '❌ Yanlış Cevap',
        'captcha.wrong.body': 'Captcha cevabı yanlış. Lütfen {command} ile tekrar deneyin.',
        'captcha.ratelimit': 'Çok fazla captcha denemesi. 5 dakika sonra tekrar dene.',
        'captcha.lockout': 'Çok fazla yanlış deneme. 1 saat sonra tekrar dene.',

        // Hype Akışı
        'hype.cooldown': '### ⏳ Hype Bekleme Süresi\n{message}',
        'hype.not_found': '### ❌ Bulunamadı\nBu sunucu Hypez sistemine kayıtlı değil. Önce `/setup` komutunu çalıştırın.',
        'hype.error': '### ❌ Hata\nHype kaydedilemedi. Lütfen tekrar deneyin.',
        'hype.error.owner': '❌ Sunucu sahipleri kendi sunucularına Hype veremez!',
        'hype.embed.title': '🔥 Hype Doğrulama',
        'hype.embed.desc': '**Sunucu:** {serverName}\n**Verilecek Puan:** ~{points} pts\n\nHype\'ınızı doğrulamak için aşağıdaki captcha\'yı çözün!',
        'hype.embed.footer': 'Hypez • Hype Sistemi — 40 saniye zaman aşımı',
        'hype.success.title': '✅ Hype Başarılı!',
        'hype.success.body': '**{serverName}** sunucusuna Hype verdiniz!\n\n**Kazanılan Puan:** +{points}\n**Kalan Haftalık Hype:** {remaining}/{total}\n{nextAvailable}',
        'hype.success.next_available': '\n**Sıradaki Hype Süresi:** {time}',
        'hype.success.weekly_limit': '\n**Haftalık limit doldu! Pazartesi günü sıfırlanacak.**',

        // Settings Komutu
        'settings.title': '⚙️ Sunucu Ayarları',
        'settings.description': 'Sunucunuzun dilini ve kategorilerini yapılandırın.',
        'settings.language.label': 'Mevcut Dil',
        'settings.categories.label': 'Kategoriler',
        'settings.language.button': 'Dil',
        'settings.categories.button': 'Kategoriler',
        'settings.language.select': '**Sunucu dilinizi seçin:**',
        'settings.categories.select': '**Sunucu kategorilerinizi seçin** (en fazla 2):',
        'settings.language.updated': '✅ **Dil güncellendi!** {flag} **{name}**',
        'settings.categories.updated': '✅ **Kategoriler güncellendi!**\n{categories}',
        'settings.no.categories': '*Kategori ayarlanmadı*',
        'settings.footer': 'Hypez • Sunucu Yapılandırması',
        'settings.error': '❌ Ayarlar güncellenirken bir hata oluştu.',
        'settings.permission.denied': '❌ Bu komutu kullanmak için Yönetici yetkisine ihtiyacınız var.',

        // Settings v2 ekleri
        'settings.invite_url.label': 'Davet Linki',
        'settings.not_set_invite': '*Ayarlanmadı — /setinvite ile ekleyin*',
        'settings.info': '*ℹ️ Bilgi: Kategoriler arama filtresinde ve sitede görünür. En fazla 3 kategori seçebilirsiniz. **Davet linki zorunludur** — \`/setinvite\` komutuyla ayarlayın.*',
        'settings.button.lang': 'Dil Değiştir',
        'settings.button.cats': 'Kategori Seç',
        'settings.categories.placeholder': 'Kategori seç (en fazla 3)',
        'settings.language.placeholder': 'Dil seç',
        'settings.categories.title': '📂 **Kategori Seç**\nSunucunun listede görüneceği kategoriler (en fazla 3):',
        'settings.categories.updated.info': '✅ Kategoriler kaydedildi: {catNames}\n\n*Sunucunuz web sitesinde bu kategoriler altında listelenecek.*',
        'settings.categories.error': '❌ Kategori kaydedilirken hata oluştu.',
        'settings.language.error': '❌ Dil güncellenirken hata oluştu.',
        'settings.not_selected': '*Henüz seçilmedi*',

        // Ping Komutu
        'ping.response': '🏓 Pong!\n**Bot Gecikmesi:** `{latency}ms`\n**Discord API Gecikmesi:** `{apiLatency}ms`',

        // Premium Komutu
        'premium.title': 'Premium Durumu — {serverName}',
        'premium.tier.token': '🔷 TOKEN',
        'premium.tier.premium': '⭐ PREMIUM',
        'premium.tier.free': '⚪ ÜCRETSİZ',
        'premium.expires': 'Bitiş Tarihi',
        'premium.permanent': '**Süresiz**',
        'premium.votes': 'Oy Sayısı',
        'premium.weekly_hype': 'Haftalık Hype',
        'premium.desc.free': '🔓 Bu sunucu **Ücretsiz** paketi kullanıyor.\n\nAvantajları açmak için Premium\'a yükseltin:\n• Öne çıkan listeleme\n• Daha hızlı bump (2 saatte bir)\n• 2 kat oy gücü\n• Animasyonlu banner\n• Öncelikli destek\n\nYükseltmek için https://hypez.live/premium adresini ziyaret edin!',
        'premium.desc.token': '🔷 Bu sunucu özel bir tanıma seviyesi olan **TOKEN** rozetine sahiptir.\nTüm premium avantajların yanı sıra özel Token ayrıcalıklarının keyfini çıkarın.',
        'premium.desc.premium': '⭐ Bu sunucu **Premium** pakete sahiptir.\nÖne çıkan listeleme, daha hızlı bump ve öncelikli desteğin keyfini çıkarın!',
        'premium.failed': '❌ Premium durumu sorgulanamadı.',

        // Say Komutu
        'say.stats.title': '📊 Sunucu İstatistikleri — {serverName}',
        'say.stats.members': 'Toplam Üye',
        'say.stats.active': 'Aktif Üye',
        'say.stats.votes': 'Toplam Oy',
        'say.stats.boosts': 'Boost Sayısı',
        'say.failed': '❌ Sunucu istatistikleri alınamadı.',

        // Setinvite Komutu
        'setinvite.no_channel': '❌ Davet oluşturmak için uygun bir kanal bulunamadı. Lütfen elle bir link belirtin: `/setinvite link:discord.gg/kodunuz`',
        'setinvite.invalid_format': '❌ Geçersiz davet linki. Lütfen `discord.gg/kodunuz` veya `https://discord.gg/kodunuz` formatında girin.',
        'setinvite.created.title': '✅ Davet Linki Oluşturuldu',
        'setinvite.updated.title': '✅ Davet Linki Güncellendi',
        'setinvite.body': '**{serverName}** için davet linki kaydedildi.\n\n🔗 **Link:** {inviteUrl}\n🌐 **Sunucu Sayfası:** {webUrl}/servers/{guildId}',
        'setinvite.open_discord': 'Discord\'da Aç',
        'setinvite.view_server': 'Sunucuyu Gör',

        // Setup Apps Komutu
        'setup_apps.title': 'BAŞVURU MERKEZİ',
        'setup_apps.body': 'Lütfen yapmak istediğiniz başvuru türünü aşağıdaki menüden seçin.\n\n**🌟 Yayıncı Başvurusu:** Eğer aktif olarak yayın yapıyorsanız ve kitleniz varsa başvurun.\n**✅ Onaylı Sunucu:** Sunucunuz belirli şartları karşılıyorsa Onaylı Sunucu rozeti alın.\n**🤝 Partnerlik:** Sistemimizle uzun soluklu bir partnerlik planlıyorsanız bu seçeneği kullanın.',
        'setup_apps.placeholder': 'Başvuru Türünü Seçin',
        'setup_apps.streamer.label': 'Yayıncı Başvurusu',
        'setup_apps.streamer.desc': 'Yayıncılar için özel başvuru formu',
        'setup_apps.verified.label': 'Onaylı Sunucu Başvurusu',
        'setup_apps.verified.desc': 'Onaylı sunucu olmak için başvurun',
        'setup_apps.partner.label': 'Partnerlik Başvurusu',
        'setup_apps.partner.desc': 'Bizimle partner olmak için başvurun',
        'setup_apps.invalid_channel': 'Geçersiz kanal türü.',
        'setup_apps.success_message': '✅ Başvuru mesajı başarıyla kanala gönderildi!',
        'setup_apps.error_prefix': '❌ Hata oluştu:',

        // Applications Modal submit
        'application.modal.title': 'Başvuru Formu',
        'application.fields.server_id.label': 'Sunucu ID (Eğer varsa)',
        'application.fields.reason.label': 'Neden başvuruyorsunuz? / Açıklama',
        'application.fields.reason.placeholder': 'Lütfen kendinizi ve sunucunuzu tanıtın...',
        'application.submit.success': '✅ Başvurunuz başarıyla alındı. Yönetim ekibimiz en kısa sürede inceleyecektir.',
        'application.submit.error': '❌ Başvurunuz kaydedilirken bir hata oluştu.',

        // Setup Komutu Panosu
        'setup.board.desc': 'Bu ay **{votes} Oy** ve **{hype} Hype** ile **#{rank}.** sıradayız! Hypez\'de bizi desteklemeyi unutma. Oy vererek sıralamada yükselmemize, Hype\'layarak bu haftanın Trend listesine girmemize katkı sağlayabilirsin. Bizi desteklediğin için Teşekkürler!',
        'setup.board.vote_btn': 'Oy Ver',
        'setup.board.view_btn': 'Sunucuyu Gör',
        'setup.board.last_vote': '-# 🗳️ Son oy: **{username}** · {time}',
        'setup.board.no_votes': '-# *Henüz oy veren olmadı*',
        'setup.board.setup_time': '-# 🕒 Kurulum: {relative} · {full}',
        'setup.no_data': 'Henüz veri bulunmuyor.'
    }
};

// Helper function to get server locale
export async function getLocale(client: any, guildId: string): Promise<'tr' | 'en'> {
    try {
        const server = await client.prisma.server.findUnique({
            where: { id: guildId },
            select: { locale: true }
        });
        return (server?.locale as 'tr' | 'en') || 'en';
    } catch (error) {
        console.error('[i18n] Failed to get locale:', error);
        return 'en'; // Default to English on error
    }
}

export function t(key: string, locale: string = 'en', args?: Record<string, string | number>): string {
    const dict = locales[locale] || locales['en'];
    let text = dict[key] || key;

    if (args) {
        for (const [k, v] of Object.entries(args)) {
            text = text.split(`{${k}}`).join(String(v));
        }
    }
    return text;
}
