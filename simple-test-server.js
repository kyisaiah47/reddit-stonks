#!/usr/bin/env node

// Simple test server for search API endpoints
import express from 'express';
import { createServer as createHttpServer } from 'http';

const app = express();
app.use(express.json());

// Basic API routes to test search functionality
app.get('/api/stocks', (req, res) => {
  const sampleStocks = [
    { id: 'wsb', symbol: 'WSB', name: 'r/wallstreetbets', price: 2358.66, change: 5.23, volume: 89234, category: 'meme' },
    { id: 'ask', symbol: 'ASK', name: 'r/askreddit', price: 111421.42, change: -0.89, volume: 34567, category: 'blue-chip' },
    { id: 'game', symbol: 'GAME', name: 'r/gaming', price: 61165.33, change: 2.14, volume: 12345, category: 'entertainment' },
    { id: 'tech', symbol: 'TECH', name: 'r/technology', price: 52053.21, change: 3.45, volume: 23456, category: 'tech-growth' }
  ];

  let results = [...sampleStocks];
  
  if (req.query.q) {
    const query = req.query.q.toLowerCase();
    results = results.filter(stock => 
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  }
  
  if (req.query.category) {
    results = results.filter(stock => stock.category === req.query.category);
  }
  
  if (req.query.limit) {
    results = results.slice(0, parseInt(req.query.limit));
  }

  res.json({
    stocks: results,
    totalCount: results.length,
    filters: req.query,
    note: 'Search API test data'
  });
});

app.get('/api/search/suggestions', (req, res) => {
  const suggestions = ['WSB', 'ASK', 'TECH', 'GAME', 'DOGE', 'GME'];
  const query = req.query.q?.toLowerCase() || '';
  const filtered = suggestions.filter(s => s.toLowerCase().includes(query));
  
  res.json({ suggestions: filtered });
});

const port = 3001;
const server = createHttpServer(app);

server.listen(port, () => {
  console.log(`✅ Simple test server running on port ${port}`);
  console.log(`🧪 Test endpoints:`);
  console.log(`   GET http://localhost:${port}/api/stocks`);
  console.log(`   GET http://localhost:${port}/api/stocks?q=gaming`);
  console.log(`   GET http://localhost:${port}/api/stocks?category=meme`);
  console.log(`   GET http://localhost:${port}/api/search/suggestions?q=w`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});