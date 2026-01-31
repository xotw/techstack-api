/**
 * Tech Stack Detection API
 * Better than BuiltWith - uses multiple detection methods
 */

import express from 'express';
import { detectTechStack, closeBrowser } from './services/detector.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

/**
 * GET /api/techstack
 * Detect tech stack for a domain
 */
app.get('/api/techstack', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({
      error: 'missing_param',
      message: 'domain parameter required'
    });
  }

  // Normalize domain
  const normalizedDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

  try {
    const startTime = Date.now();
    const result = await detectTechStack(normalizedDomain);
    const duration = Date.now() - startTime;

    return res.json({
      domain: normalizedDomain,
      duration_ms: duration,
      ...result
    });
  } catch (err) {
    console.error(`Error detecting tech stack for ${normalizedDomain}:`, err.message);
    return res.status(500).json({
      error: 'detection_failed',
      message: err.message,
      domain: normalizedDomain
    });
  }
});

/**
 * POST /api/techstack/batch
 * Detect tech stack for multiple domains
 */
app.post('/api/techstack/batch', async (req, res) => {
  const { domains } = req.body;

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({
      error: 'invalid_param',
      message: 'domains array required in request body'
    });
  }

  if (domains.length > 10) {
    return res.status(400).json({
      error: 'too_many_domains',
      message: 'Maximum 10 domains per batch request'
    });
  }

  const results = [];
  for (const domain of domains) {
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    try {
      const result = await detectTechStack(normalizedDomain);
      results.push({
        domain: normalizedDomain,
        success: true,
        ...result
      });
    } catch (err) {
      results.push({
        domain: normalizedDomain,
        success: false,
        error: err.message
      });
    }
  }

  return res.json({ results });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log(`Tech Stack Detection API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closeBrowser();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await closeBrowser();
  server.close(() => process.exit(0));
});
