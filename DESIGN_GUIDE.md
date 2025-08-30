# Reddit Stock Exchange UI/UX Design Guide

This document describes the UI design plan for the **Reddit Stock Exchange** app, including both **mobile-first** layouts and **desktop (responsive web)** enhancements.

---

## Information Architecture (Mobile-First)

- **Tabs (bottom bar):**
  - Market
  - Portfolio
  - Activity
- **Stack routes:**
  - Asset Detail (`/asset/:id`)
  - Trade Sheet (modal)

---

## 📱 Mobile Views

### 1. Market (Home)

- **Header:** App title + notifications
- **Search input**
- **Indices row (chips):** Drama 10, Finance 10, Memes 10
- **Live ticker (marquee)**
- **List of assets** (rows instead of table):
  - Left: icon + ticker (`$WSB`)
  - Right: price + % change (badge, green/red)
  - Sparkline chart under the row title
  - Realtime blinking dot when a tick arrives

### 2. Asset Detail

- **Price strip:** big price, % change, last tick time
- **Chart:** simple area chart (24h)
- **Stats grid:** Posts/hr, Comments/hr, Hot100, New(60m), Volatility
- **Top posts today**
- **Buy/Sell button** → opens **bottom sheet modal**

### 3. Portfolio

- **Equity curve**
- **Holdings list** (ticker, qty, value, P/L%)
- **Cash balance**
- **Recent trades**

---

## 🖥️ Desktop Enhancements (Responsive)

### Layout Strategy

- **1 / 2 / 3 column grid:**
  - `sm` → single column (mobile)
  - `md` → Market (left) + Asset Detail (center)
  - `lg` → Market (left) + Asset Detail (center) + Events/News (right)

### Market Panel (Left)

- **Mobile:** scrollable card list
- **Desktop:** dense **table view** with columns:
  - Asset, Price, % change
  - Posts/hr, Volatility (extra columns for lg+)

### Asset Detail (Center)

- **Price strip:** with timeframe selector (24h / 7d / 30d)
- **Chart:** adds gridlines + hover crosshair on desktop
- **Stats grid:** same as mobile but in 5-column layout
- **Top drivers:** post cards
- **Buy button:** mobile prominent; desktop secondary

### Events Panel (Right)

- **Desktop-only:**
  - Moderation events (reports/removals)
  - Trade events (buys/sells)
  - Display as timeline / feed

### Portfolio (Desktop)

- Adds:
  - Equity curve (line or area)
  - Allocation donut
  - Recent trades table

---

## 🎨 Component Patterns

### Bottom Tab Bar (Mobile)

- Fixed at bottom, 3 tabs: Market, Portfolio, Activity

### Market Row

- Shows icon, ticker, subtitle
- Price + % change badge
- Sparkline chart
- Realtime blink dot on updates

### Asset Detail

- Header with Follow button
- Price + % change
- Area chart with event markers
- Stats grid (metrics)
- Top posts (drivers of activity)
- Buy/Sell bottom sheet (mobile)

### Trade Sheet

- Bottom modal with:
  - Side (Buy/Sell)
  - Price
  - Quantity input
  - Confirm button

---

## 💡 Design Checklist

- Thumb-friendly tap targets (≥48px)
- Dark theme default (Reddit/fintech vibe)
- Tabular numbers for prices
- Abbreviated counts (`1.2k`)
- Skeleton loaders
- Realtime blinking feedback
- Charts = lightweight inline SVGs

---

## ✅ MVP Priority

1. **Market list + ticker**
2. **Asset detail with chart + Buy flow**
3. **Portfolio overview**

Optional for polish:

- Event spikes (mod actions, reports)
- Indices (Drama 10, etc.)
- Leaderboards (top traders)
- Volatility heatmap

---

## Responsive Behavior Summary

- **Mobile:** Simple, card-based, bottom tab nav
- **Tablet (md):** Adds side-by-side Market + Asset views
- **Desktop (lg):** 3-column Bloomberg-style layout with Market, Asset, Events
