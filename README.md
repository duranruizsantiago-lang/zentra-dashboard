<p align="center">
  <h1 align="center">📊 Zentra Dashboard</h1>
  <p align="center">
    <strong>E-commerce Analytics & Campaign Management Dashboard</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white" />
    <img src="https://img.shields.io/badge/Recharts-2.x-FF6B35?style=flat-square" />
  </p>
</p>

---

## Overview

Zentra Dashboard is the **web-based control center** for e-commerce businesses using the Zentra platform. It provides real-time analytics, campaign management, inventory tracking, and sales insights — all wrapped in a premium dark-mode interface deployed on Vercel.

### Features

- 📈 **Real-time Analytics** — Revenue, orders, and conversion tracking with interactive charts
- 🎯 **Campaign Management** — Create and monitor AI-generated product campaigns
- 📦 **Inventory Management** — Product catalog with stock levels and alerts
- 💰 **Sales Tracking** — Detailed transaction history with trend analysis
- 🔐 **Authentication** — Secure login with workspace-scoped access
- 🌙 **Premium Dark Mode** — Glassmorphism UI optimized for extended use
- 🚀 **Vercel Deployment** — CI/CD via GitHub Actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5.x |
| Styling | TailwindCSS 3.x |
| Charts | Recharts 2.x |
| Routing | React Router 6 |
| Deployment | Vercel (GitHub Actions CI/CD) |
| Backend | Zentra API (separate repo) |

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/duranruizsantiago-lang/zentra-dashboard.git
cd zentra-dashboard
npm install

# 2. Run development server
npm run dev
# Opens on http://localhost:5173

# 3. Build for production
npm run build
```

## Project Structure

```
src/
├── pages/          # Route pages (Overview, Sales, Inventory, Login)
├── components/     # Reusable UI components
├── layouts/        # Page layout wrappers
├── lib/            # Utilities and helpers
└── index.css       # Global styles & design tokens
```

## Deployment

Automated via GitHub Actions → Vercel. Every push to `main` triggers a production deployment.

## License

Private — All rights reserved.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/duranruizsantiago-lang">Santiago Durán Ruiz</a>
</p>
