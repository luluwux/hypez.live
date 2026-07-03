# Contributing to Hypez

First off, thank you for considering contributing to Hypez! It's people like you that make Hypez a great tool for the Discord community.

When contributing to this repository, please first discuss the change you wish to make via issue, Discord, or any other method with the owners of this repository before making a change.

Please note we have a [Code of Conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Local Development Setup

Hypez is a monorepo powered by [Turborepo](https://turbo.build/).

### Prerequisites

- **Node.js**: >= 18
- **PostgreSQL**: Database server
- **Redis**: For caching and queues (captcha rate limits, leaderboard queue)

### Steps to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/luluwux/hypez.live.git
   cd hypez.live
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create `.env` files in the root, `apps/api/`, `apps/bot/`, and `apps/web/` based on the `.env.example` templates provided in those directories.

4. **Initialize the Database:**
   Apply database migrations and seed default data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This will run Next.js (web frontend), NestJS (api backend), and Discord.js (bot) concurrently.

## Pull Request Guidelines

1. **Create a branch:** Use a clear branch name like `feat/allow-owner-votes` or `fix/invite-url-reset`.
2. **Coding Standards:** Ensure your code is formatted with Prettier and compiles without TypeScript warnings:
   ```bash
   npm run format
   npm run check-types
   ```
3. **Commit Messages:** Write clear, concise commit messages (following conventional commits is preferred, e.g. `feat: ...`, `fix: ...`).
4. **Update Documentation:** If you changed any APIs or user guides, update the `README.md` or corresponding files.
5. **Open the PR:** Describe your changes clearly in the PR description using the template.

Thank you for your contributions!
