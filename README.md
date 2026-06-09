<div align="center">

<!-- BANNER_PLACEHOLDER -->

# 📈 Reddit Stonks

**Trade shares in subreddits like stocks — where memes move markets**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Devvit](https://img.shields.io/badge/Reddit%20Devvit-FF4500?style=for-the-badge&logo=reddit&logoColor=white)](https://developers.reddit.com/)

</div>

<br/>

Reddit Stonks is a fully interactive trading platform built on Reddit's Devvit platform — buy and sell "shares" in subreddits as if they were stocks, with real-time price animations, meme-powered notifications, and a swipe-to-trade mobile interface. It turns Reddit's social dynamics into a gamified market where diamond hands are rewarded and paper hands are called out. Built for the Reddit Fun and Games with Devvit Web Hackathon 2025.

## ✨ Features

- **Swipe-to-Trade** — Right swipe to BUY, left swipe to SELL; touch-native gestures with haptic feedback on successful trades
- **Real-Time Price Animations** — Pulsing flash effects, smooth number counters, and floating particle effects respond to every market move
- **Meme-Powered Notifications** — "💎🙌 DIAMOND HANDS ACTIVATED" and "🚀 TO THE MOON" messages fire on key trade events, keeping the Reddit personality front and center
- **Dynamic Market Sentiment Meter** — A live BULLISH / BEARISH / NEUTRAL indicator shifts the entire UI color palette in real time
- **Achievement System** — Unlock badges like "Welcome to the Casino" (first trade), "Diamond Hands" (hold through a 20% dip), and "Moon Mission" (50% portfolio gain)
- **Live Leaderboard** — Compete against other traders ranked by portfolio value, with a live activity feed showing trades as they happen

## 🎥 Demo

[![Watch Demo](https://img.shields.io/badge/YouTube-Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=UNumNpU0XWo)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Framer Motion |
| Styling | Tailwind CSS |
| Animations | Framer Motion (swipe gestures, micro-interactions, page transitions) |
| Backend | Express + Redis (portfolio persistence, trading engine) |
| Platform | Reddit Devvit (Web Views) |
| State | Custom React hooks (`useMarketData`, `usePortfolio`, `useMemeMessages`) |

## 🚀 Getting Started

```bash
git clone https://github.com/kyisaiah47/reddit-stonks
cd reddit-stonks
npm install
npm run dev       # Start development with live reload
npm run build     # Production build
npm run deploy    # Deploy to Reddit Devvit
npm run check     # Type check + lint + format
```

## 📄 License

MIT
