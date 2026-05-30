# <p align="center"><img src="./image/logo.png" alt="Hypez.live Logo" width="160"></p>

# <p align="center">⚡ Hypez.live — Discord Server & Bot Discovery Platform</p>

<p align="center">
  <img src="./image/banner.png" alt="Hypez Banner" width="100%">
</p>

<p align="center">
  <strong>Hypez.live</strong> is a next-generation <strong>Discord Server & Bot Listing and Management Platform</strong> designed for modern Discord communities and bot developers to showcase their projects with the highest level of visual and technical sophistication.
</p>

---

## 🚀 Project Overview

Hypez.live is built on a hierarchical monorepo architecture (Turborepo), a high-performance Next.js frontend, an enterprise-grade NestJS backend, and a robust PostgreSQL database powered by Prisma ORM.

Going far beyond standard listing websites, the platform features a real-time data engine capable of tracking voice channel activity, message density, and streamer status on servers, along with advanced moderation and administration tools.

---

## 🛠️ Architecture & Technical Stack

The project is structured as a monorepo, strictly adhering to SOLID software principles and ensuring a robust Separation of Concerns (SoC):

```
hypez-monorepo/
├── apps/
│   ├── web/          # Next.js (App Router, Tailwind CSS, TypeScript, i18n)
│   └── api/          # NestJS (Scalable API, Dependency Injection, Prisma Client)
├── packages/         # Shared configurations (TSConfig, ESLint, Shared UI components)
├── prisma/           # PostgreSQL Schema, Migration Files, and Seed Scripts
└── image/            # Project image assets, logos, and banners
```

### Core Technologies

*   **Frontend (Web Client):** Next.js (React 18+, Server Components), Tailwind CSS, Framer Motion (micro-animations), shadcn/ui.
*   **Backend (REST & Gateway):** NestJS, TypeScript, Passport.js (Discord OAuth2), RxJS.
*   **Database & ORM:** PostgreSQL, Prisma ORM (Strict types, optimized data indexing).
*   **Monorepo Management:** Turborepo, npm Workspaces.

---

## ✨ Key Features

### 📊 1. Real-time Server Analytics & Activity Metrics
Beyond basic voting systems, our integrated bot infrastructure actively tracks:
*   Weekly voice channel duration (Voice Minutes).
*   Concurrent active voice, video, and streaming member counts.
*   Message and interaction statistics to generate visual metrics.

### 🗳️ 2. Dynamic Hype & Vote Algorithm
*   **Hype Score:** A proprietary popularity metric calculated based on weekly engagement rates rather than simple raw vote counts.
*   **ISO Week Tracking:** Utilizing the `HypeVote` model formatted as `2026-W22` (ISO standard) to handle fair weekly resets and competitive leaderboards.

### 🛡️ 3. Multi-Layered Verification System
Ensures the highest quality of listed servers through customizable validation modes:
*   `LOGIC`: Algorithmic checks and rule validations.
*   `VISUAL`: Image-based and bot-human separation challenges.
*   `IDENTITY`: Verified ownership and identity checks.

### 📑 4. Modular Application Portal
An advanced application management mechanism for special roles: Partner (`PARTNER`), Verified Server (`VERIFIED`), and Streamer (`STREAMER`):
*   Direct data capture via Discord modal integrations.
*   Administrative review dashboard (Approve, Reject, and Reviewer Notes).
*   Automatic 30-day cooldown enforcement upon application rejection.

### ⚙️ 5. Centralized Bot & System Management
*   **Granular Permissions:** Detailed control over critical, administrative, and basic bot permissions (`BotPermission`).
*   **System Logging:** Categorized logging (Errors, Commands, APIs, System) with an automatic 30-day retention cleanup scheduler.
*   **Maintenance Mode:** Ability to toggle the entire platform into maintenance mode with a single switch (`SystemSettings`).

---

## 🗄️ Database Model (Prisma)

To ensure maximum data integrity and lightning-fast query performance, PostgreSQL database indexes are heavily optimized. Key models include:

*   **Server:** Contains stats, emojis, stickers, and application history. Optimized with compound indexes like `[isPremium, votes(desc)]` to deliver leaderboard listings in milliseconds.
*   **User:** Stores Discord profile details, custom badges, trust scores (`trustScore`), and social media integrations.
*   **AuditLog:** Chronologically tracks all sensitive administrative changes (e.g., granting premium, deleting servers) with serialized details for transparency.

---

## 💻 Installation & Development

### Prerequisites
*   Node.js >= 18
*   PostgreSQL
*   npm >= 10

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/luluwux/hypez.live.git
cd hypez.live
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` files in the root and app directories to `.env`, then fill in your Discord API keys and PostgreSQL connection strings:
```bash
cp luppux/.env.example luppux/.env
```

### 3. Initialize the Database
Apply the Prisma schema migrations and populate initial data via the seed script:
```bash
npm run db:push
npm run db:seed
```

### 4. Start the Development Servers
Launch all monorepo apps (Web & API) concurrently using the power of Turborepo:
```bash
npm run dev
```

---

## 🎨 Design System & Code Quality

Hypez.live incorporates modern design trends including a Sleek Dark Theme, rich gradients, smooth glassmorphism effects, and highly engaging micro-animations. Code quality is maintained at the highest level with strict TypeScript configurations, clean design patterns, and rigorous modular separation.
