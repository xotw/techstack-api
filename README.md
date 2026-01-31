# Tech Stack Detection API

Detect website tech stacks with higher accuracy than BuiltWith or Brevo. Uses multiple detection methods: DNS records, HTML analysis, HTTP headers, and JavaScript runtime inspection.

## Features

- **100% ESP detection** on domains that BuiltWith/Brevo return "Unknown"
- **Multi-method detection**: DNS (MX, SPF, CNAME), HTML, headers, JS globals
- **100+ technologies** detected across 10 categories
- **Graceful fallback**: DNS-only mode when browser fails
- **Browser recycling**: Prevents memory bloat in production

## Categories Detected

| Category | Examples |
|----------|----------|
| **ESP** | Klaviyo, Mailchimp, SendGrid, Iterable, Customer.io, HubSpot, ActiveCampaign |
| **Analytics** | Google Analytics, Mixpanel, Amplitude, Heap, Segment, Hotjar |
| **E-commerce** | Shopify, BigCommerce, Magento, WooCommerce, Salesforce Commerce Cloud |
| **Marketing** | Facebook Pixel, TikTok, Pinterest, LinkedIn, Google Ads, Criteo |
| **Chat** | Intercom, Drift, Zendesk, Gorgias, Tidio, LiveChat |
| **A/B Testing** | Optimizely, VWO, AB Tasty, Dynamic Yield |
| **Tag Manager** | GTM, Adobe Launch, Tealium, Segment |
| **CMS** | WordPress, Next.js, Nuxt.js, Webflow, Drupal |
| **CDN** | Cloudflare, Fastly, Akamai, CloudFront |
| **Payment** | Stripe, PayPal, Klarna, Affirm |

## API Endpoints

### GET /api/techstack

Detect tech stack for a single domain.

```bash
curl "http://localhost:3001/api/techstack?domain=allbirds.com"
```

Response:
```json
{
  "domain": "allbirds.com",
  "duration_ms": 5200,
  "esp": [
    {"name": "Iterable", "confidence": "high", "source": "cname"},
    {"name": "Klaviyo", "confidence": "high", "source": "js"}
  ],
  "ecommerce": [
    {"name": "Shopify", "confidence": "high", "source": "meta"}
  ],
  "analytics": [...],
  "marketing": [...],
  "chat": [...],
  "cdn": [...],
  "detection_methods": {
    "dns": true,
    "html": true,
    "headers": true,
    "javascript": true
  }
}
```

### POST /api/techstack/batch

Detect tech stack for multiple domains (max 10).

```bash
curl -X POST "http://localhost:3001/api/techstack/batch" \
  -H "Content-Type: application/json" \
  -d '{"domains": ["allbirds.com", "vuoriclothing.com"]}'
```

### GET /health

Health check endpoint.

## Run Locally

```bash
npm install
npx playwright install chromium
npm start
```

## Deploy with Docker

```bash
docker build -t techstack-api .
docker run -p 3001:3001 techstack-api
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |

## Detection Methods

1. **DNS Records**
   - MX records → Email provider (Klaviyo, SendGrid, etc.)
   - TXT/SPF records → Email authentication hints
   - CNAME records → CDN, hosting, tracking domains

2. **HTML Analysis**
   - Script sources → Analytics, marketing pixels, chat widgets
   - Meta tags → CMS, e-commerce platform
   - Inline scripts → ESP tracking code

3. **HTTP Headers**
   - Server header → CDN detection
   - X-Powered-By → Framework detection

4. **JavaScript Globals**
   - Runtime detection of loaded libraries (Klaviyo, Shopify, GTM, etc.)

## Performance

- Browser recycling every 50 requests (prevents memory leaks)
- DNS fallback when browser times out
- ~5-20 seconds per domain (full detection)
- ~500ms per domain (DNS-only fallback)
