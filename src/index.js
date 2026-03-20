/**
 * Tech Stack Detection API
 * Multi-method website technology detection
 */

import express from 'express';
import { detectTechStack, closeBrowser } from './services/detector.js';
import { getCache, setCache, getCacheStats, clearCache } from './services/cache.js';
import { flattenForClay } from './services/flatten.js';
import { requireApiKey } from './middleware/auth.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * GET /api/techstack
 * Detect tech stack for a domain
 */
app.get('/api/techstack', requireApiKey, async (req, res) => {
  const { domain, refresh, mode, format } = req.query;
  const forceRefresh = refresh === 'true';
  const fastMode = mode === 'fast';
  const smartMode = mode === 'smart';

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

  // Check cache first (unless refresh=true)
  if (!forceRefresh) {
    const cached = getCache(normalizedDomain);
    if (cached) {
      const response = { domain: normalizedDomain, ...cached };
      if (format === 'clay' || format === 'flat') {
        return res.json(flattenForClay(response));
      }
      return res.json(response);
    }
  }

  try {
    const startTime = Date.now();
    const result = await detectTechStack(normalizedDomain, { fastMode, smartMode });
    const duration = Date.now() - startTime;

    const response = {
      domain: normalizedDomain,
      duration_ms: duration,
      cached: false,
      ...result
    };

    // Store in cache
    setCache(normalizedDomain, { duration_ms: duration, ...result });

    // Flat format for Clay / CSV integrations
    if (format === 'clay' || format === 'flat') {
      return res.json(flattenForClay(response));
    }

    return res.json(response);
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
app.post('/api/techstack/batch', requireApiKey, async (req, res) => {
  const { domains, mode, concurrency = 10 } = req.body;
  const fastMode = mode === 'fast';
  const smartMode = mode === 'smart';
  const maxConcurrency = Math.min(fastMode ? 50 : (smartMode ? 20 : 5), concurrency);

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({
      error: 'invalid_param',
      message: 'domains array required in request body'
    });
  }

  // Fast mode: 500, smart mode: 200, full mode: 20
  const maxDomains = fastMode ? 500 : (smartMode ? 200 : 20);
  if (domains.length > maxDomains) {
    return res.status(400).json({
      error: 'too_many_domains',
      message: `Maximum ${maxDomains} domains per batch (mode=${mode || 'full'})`
    });
  }

  // Normalize all domains
  const normalizedDomains = domains.map(d => d
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
  );

  // Process in parallel with concurrency limit
  const results = [];
  const chunks = [];
  for (let i = 0; i < normalizedDomains.length; i += maxConcurrency) {
    chunks.push(normalizedDomains.slice(i, i + maxConcurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (normalizedDomain) => {
        // Check cache first
        const cached = getCache(normalizedDomain);
        if (cached) {
          return {
            domain: normalizedDomain,
            success: true,
            ...cached
          };
        }

        try {
          const result = await detectTechStack(normalizedDomain, { fastMode, smartMode });
          setCache(normalizedDomain, result);
          return {
            domain: normalizedDomain,
            success: true,
            cached: false,
            ...result
          };
        } catch (err) {
          return {
            domain: normalizedDomain,
            success: false,
            error: err.message
          };
        }
      })
    );
    results.push(...chunkResults);
  }

  return res.json({
    mode: fastMode ? 'fast' : (smartMode ? 'smart' : 'full'),
    total: results.length,
    successful: results.filter(r => r.success).length,
    results
  });
});

/**
 * POST /api/cache/clear
 * Clear all cached data
 */
app.post('/api/cache/clear', requireApiKey, (req, res) => {
  const count = clearCache();
  res.json({
    success: true,
    message: `Cleared ${count} cached entries`
  });
});

/**
 * GET /health
 * Health check (no auth required)
 */
app.get('/health', (req, res) => {
  const stats = getCacheStats();
  res.json({
    status: 'ok',
    cache: stats
  });
});

const server = app.listen(PORT, () => {
  console.log(`Tech Stack Detection API running on port ${PORT}`);
  if (process.env.API_KEY) {
    console.log('API key authentication enabled');
  } else {
    console.log('WARNING: No API_KEY set - authentication disabled');
  }
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
