# <p align="center"><img src="./image/logo.png" alt="Hypez.live Logo" width="160"></p>

# <p align="center">⚡ Hypez.live — Discord Sunucu & Bot Keşif Platformu</p>

<p align="center">
  <img src="./image/banner.png" alt="Hypez Banner" width="100%">
</p>

<p align="center">
  <strong>Hypez.live</strong>, modern Discord topluluklarının ve bot geliştiricilerinin kendilerini en üst düzey görsel ve teknik yetkinlikle sergileyebileceği, yeni nesil bir <strong>Discord Sunucu & Bot Listeleme ve Yönetim Platformudur</strong>.
</p>

---

## 🚀 Proje Genel Bakışı

Hypez.live; hiyerarşik monorepo mimarisi (Turborepo), yüksek performanslı Next.js ön yüzü, kurumsal düzeyde NestJS arka yüzü ve güçlü PostgreSQL veritabanı (Prisma ORM) altyapısı üzerine inşa edilmiştir.

Platform, sıradan listeleme sitelerinin ötesine geçerek sunucuların anlık ses kanalı aktifliği, mesaj yoğunluğu, yayıncı durumları gibi metrikleri izleyebilen gerçek zamanlı bir veri motoruna ve gelişmiş moderasyon/yönetim araçlarına sahiptir.

---

## 🛠️ Mimari & Teknolojik Altyapı

Monorepo yapısı altında geliştirilen projede sorumlulukların ayrılması (Separation of Concerns) ve SOLID prensipleri en yüksek standartta uygulanmıştır:

```
hypez-monorepo/
├── apps/
│   ├── web/          # Next.js (App Router, Tailwind CSS, TypeScript, i18n)
│   └── api/          # NestJS (Scalable API, Dependency Injection, Prisma Client)
├── packages/         # Paylaşılan ortak yapılandırmalar (TSConfig, ESLint, UI Bileşenleri)
├── prisma/           # PostgreSQL Şeması, Migration Dosyaları ve Seed Scriptleri
└── image/            # Proje görsel varlıkları ve logolar
```

### Kullanılan Ana Teknolojiler

*   **Ön Yüz (Web Client):** Next.js (React 18+, Server Components), Tailwind CSS, Framer Motion (Mikro-animasyonlar), shadcn/ui.
*   **Arka Yüz (REST & Gateway):** NestJS, TypeScript, Passport.js (Discord OAuth2), RxJS.
*   **Veritabanı & ORM:** PostgreSQL, Prisma ORM (Strict types, optimize edilmiş veri indeksleme).
*   **Monorepo Yönetimi:** Turborepo, npm Workspaces.

---

## ✨ Öne Çıkan Özellikler

### 📊 1. Gelişmiş Sunucu Analitiği ve Metrik Takibi
Klasik oy verme sistemlerinin ötesinde, entegre bot altyapısı sayesinde sunucuların:
*   Haftalık ses kanalı aktiflik süreleri (Voice Minutes)
*   Aktif mikrofon/yayın/video açan kullanıcı sayıları
*   Mesaj ve etkileşim istatistikleri anlık olarak kaydedilir ve grafiklerle sunulur.

### 🗳️ 2. Hype & Vote Algoritması
*   **Hype Skor:** Sunucuların popülaritesini sadece oylarla değil, haftalık dinamik etkileşim katsayılarıyla ölçen özel "Hype Score" formülü.
*   **ISO Hafta Takibi:** `HypeVote` modeli üzerinden `2026-W22` gibi standartlarda haftalık sıfırlanan ve adil rekabet sağlayan liderlik tabloları.

### 🛡️ 3. Çok Katmanlı Güvenlik & Doğrulama (Verification)
Farklı doğrulama modları sayesinde sunucu kalitesi en üst düzeyde tutulur:
*   `LOGIC`: Mantıksal kontroller ve kurallar.
*   `VISUAL`: Görsel ve bot-insan ayrımı yapan doğrulama modülleri.
*   `IDENTITY`: Yetkilendirilmiş kimlik ve mülkiyet doğrulama adımları.

### 📑 4. Başvuru Portalı (Application System)
Partnerlik (`PARTNER`), Onaylı Sunucu (`VERIFIED`) ve Yayıncı (`STREAMER`) başvuruları için gelişmiş başvuru yönetim mekanizması:
*   Discord modal entegrasyonu üzerinden doğrudan veri alımı.
*   Yönetici inceleme paneli (Reddetme, Onaylama ve Admin Notları).
*   Reddedilen başvurular için otomatik 30 günlük bekleme süresi (Cooldown) kontrolü.

### ⚙️ 5. Merkezi Bot & Sistem Yönetimi
*   **Modüler Yetkilendirme:** Kritik, yönetimsel ve temel yetkilerin ayrıntılı kontrolü (`BotPermission`).
*   **Sistem Loglama:** Hatalar, komut kullanımları ve API loglarının 30 günlük otomatik temizleme (Retention) süresiyle saklanması.
*   **Bakım Modu:** Tek merkezden tüm platformu bakım moduna alabilme yeteneği (`SystemSettings`).

---

## 🗄️ Veritabanı Veri Modeli (Prisma)

Veri tutarlılığını ve hızlı arama performansını garantilemek amacıyla PostgreSQL tarafında kritik indekslemeler yapılmıştır. Öne çıkan ilişkiler şunlardır:

*   **Server:** Sunucu istatistiklerini, emojileri, stickerları ve başvuru geçmişini barındırır. `[isPremium, votes(desc)]` gibi birleşik indeksler sayesinde sıralama işlemleri milisaniyeler içinde gerçekleşir.
*   **User:** Discord profil verilerini, sahip olduğu rozetleri (`badges`), güvenilirlik skorunu (`trustScore`) ve sosyal medya linklerini saklar.
*   **AuditLog:** Yöneticilerin gerçekleştirdiği tüm hassas işlemler (Premium verme, sunucu silme vb.) geriye dönük izlenebilirlik amacıyla şifrelenmiş detaylarla kaydedilir.

---

## 💻 Kurulum & Çalıştırma

### Gereksinimler
*   Node.js >= 18
*   PostgreSQL
*   npm >= 10

### 1. Depoyu Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/luluwux/hypez.live.git
cd hypez.live
npm install
```

### 2. Çevre Değişkenlerini Yapılandırın
Kök dizindeki ve uygulama klasörlerindeki `.env.example` dosyalarını `.env` olarak kopyalayıp gerekli Discord API anahtarlarını ve PostgreSQL bağlantı adreslerini girin:
```bash
cp luppux/.env.example luppux/.env
```

### 3. Veritabanını Hazırlayın
Prisma şemasını veritabanına uygulayın ve başlangıç verilerini (seed) yükleyin:
```bash
npm run db:push
npm run db:seed
```

### 4. Geliştirme Sunucusunu Başlatın
Tüm monorepo uygulamalarını (Web & API) aynı anda başlatmak için Turborepo gücünü kullanın:
```bash
npm run dev
```

---

## 🎨 Tasarım Standartları & Kalite Güvencesi

Hypez.live, modern karanlık tema (Sleek Dark Mode), cam efekti (Glassmorphism), derinlik algısı oluşturan degradeler (Gradients) ve kullanıcıyı yormayan akıcı mikro-animasyonlar ile tamamen premium bir kullanıcı deneyimi sunar. Kod kalitesi olarak SOLID yazılım prensipleri, temiz kod mimarisi ve tip güvenliği en ön planda tutulmuştur.
