/**
 * API Key authentication middleware
 */

export function requireApiKey(req, res, next) {
  // Skip auth if no API_KEY is configured
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return next();
  }

  // Check header or query param
  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey) {
    return res.status(401).json({
      error: 'missing_api_key',
      message: 'API key required. Provide via X-API-Key header or api_key query param.'
    });
  }

  if (providedKey !== apiKey) {
    return res.status(403).json({
      error: 'invalid_api_key',
      message: 'Invalid API key'
    });
  }

  next();
}
