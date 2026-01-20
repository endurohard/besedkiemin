const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 5173;
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3000';

// Log all requests
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url.replace(/^\/api/, '')}`);
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.url}`);
    },
    error: (err, req, res) => {
      console.error('[Proxy] Error:', err.message);
      res.status(503).json({ error: 'Backend unavailable', message: err.message });
    },
  },
}));

// Proxy uploads
app.use('/uploads', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
}));

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API proxy: /api -> ${BACKEND_URL}`);
});
