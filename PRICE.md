# Reddit Stock Exchange — Stock Price Calculation Strategy

This document outlines how **subreddit "stock prices"** are calculated for the Reddit Stock Exchange app.

---

## 🎯 Goals

- Derive believable, game-like "prices" from **Reddit activity**.
- Update prices on a **2–5 minute tick** (using Devvit + Redis).
- Smooth out noise, but allow **volatility spikes** (reports, drama).

---

## 1. Metrics to Collect Each Tick

From `context.reddit` (subreddit listings):

- `hot_count_100` — number of posts in Hot (limit 100).
- `new_60m` — count of new posts in last 60 minutes.
- `comment_volume_60m` — total comments on new posts in last 60 minutes.
- `avg_score_60m` — average score of new posts in last 60 minutes.
- `upvote_ratio_avg_60m` — average upvote ratio of new posts.

Optional (if triggers enabled):

- `reports_60m` — reports in the last hour.
- `removals_60m` — mod removals.

---

## 2. Normalize Metrics (Rolling Min/Max)

Each metric is normalized to `[0,1]` using **rolling min/max** stored in Redis.

```ts
norm = (x - rollMin) / (rollMax - rollMin + 1e-6);
```

- Rolling bounds (`rollMin`, `rollMax`) **decay** toward current values each tick to adapt.

---

## 3. Weighted Activity Index

Weights sum to ~1:

```
activity =
  0.25 * hot +
  0.25 * newPosts +
  0.30 * commentVol +
  0.15 * avgScore +
  0.05 * upvote
```

- Produces an **activityIndex** in `[0,1]`.

---

## 4. Base (IPO) Price

Initial base price seeded from **subscriber count**:

```
base = clamp( subs^0.4 * 0.01, 1, 200 )
```

- Ensures large subs start higher, but capped at 200.

---

## 5. Target Price per Tick

```
z = activityIndex - 0.5   // range -0.5..0.5
target = base * (1 + k * z)
```

- `k ≈ 3.0` (sensitivity multiplier).

---

## 6. Price Smoothing (EMA)

Apply an **exponential moving average**:

```
price_t = price_prev + α * (target - price_prev)
```

- `α ≈ 0.2` → smooths short-term noise.

---

## 7. Circuit Breaker

Cap changes per tick:

```
price_t = clamp(price_t, prev * (1 - 0.08), prev * (1 + 0.08))
```

- Prevents >8% moves per tick.

---

## 8. Redis Schema

```
sub:<name>:price          // current price
sub:<name>:price:prev     // last tick price
sub:<name>:metrics        // latest metrics JSON
sub:<name>:rollminmax     // rolling bounds JSON
sub:<name>:history        // bounded list of last N prices
market:tick_ts            // last tick timestamp
```

---

## 9. Realtime Push

After updating each tick, broadcast to clients via Devvit Realtime:

```ts
context.realtime.send({
  channel: `prices:sub:${sub}`,
  message: {
    t: Date.now(),
    sub,
    price: next,
    change: next - prev,
    pct: (next - prev) / prev,
  },
});
```

---

## 10. Event Spikes (Optional)

- On `PostReport` or `PostSubmit` triggers, apply a **temporary delta** to target price for added volatility.
- Example: reports spike → -3% adjustment for 2–3 ticks.

---

## ✅ Summary

- **Activity metrics** → normalized → weighted index.
- **Base price** seeded from subscribers.
- **Target** derived from activity.
- **EMA smoothing** + **circuit breaker** = believable price motion.
- **Redis persistence** builds history & charts.
- **Realtime push** keeps UI live.

This design balances **game feel** with **real Reddit activity** under API limits.
