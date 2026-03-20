# Tech Stack Detection API — Brevo Delivery

Detect any website's marketing stack, ESP, CRM, analytics, and 100+ technologies using multiple detection methods: DNS records, HTML analysis, HTTP headers, and JavaScript runtime inspection.

*Built by Gab @ Bulldozer*

## Features

- **Multi-method detection** — DNS (MX, SPF, CNAME), HTML parsing, HTTP headers, JS globals
- **100+ technologies** across 12 categories
- **3 detection modes** — `full` (browser + DNS), `smart` (DNS first, browser if needed), `fast` (DNS-only)
- **Technographic scoring** — 0-20 score based on detected ESP/marketing stack
- **Clay/CSV integration** — flat response format with `format=clay`
- **Batch processing** — up to 500 domains per request in fast mode
- **In-memory caching** — configurable TTL, avoids redundant lookups
- **Docker-ready** — Playwright + Chromium pre-installed

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install chromium

# Start the server
npm start

# Test a domain
curl "http://localhost:3000/api/techstack?domain=allbirds.com"
```

## API Endpoints

### `GET /api/techstack`

Detect tech stack for a single domain.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | string | required | Domain to analyze (e.g. `allbirds.com`) |
| `mode` | string | `full` | Detection mode: `full`, `smart`, or `fast` |
| `format` | string | — | Set to `clay` or `flat` for flat key-value response |
| `refresh` | string | — | Set to `true` to bypass cache |

**Full response:**

```json
{
  "domain": "allbirds.com",
  "duration_ms": 5200,
  "cached": false,
  "tech_score": 5,
  "tech_stack_primary": "Klaviyo",
  "tech_category": "Ecommerce Specialist",
  "esp": [
    { "name": "Iterable", "confidence": "high", "source": "cname" },
    { "name": "Klaviyo", "confidence": "high", "source": "js" }
  ],
  "ecommerce": [
    { "name": "Shopify", "confidence": "high", "source": "meta" }
  ],
  "analytics": [...],
  "marketing": [...],
  "chat": [...],
  "crm": [...],
  "cms": [...],
  "cdn": [...],
  "ab_testing": [...],
  "tag_manager": [...],
  "payment": [...],
  "hosting": [...],
  "dns_records": { "mx": [...], "txt": [...], "cname": [...] },
  "detection_methods": {
    "dns": true,
    "html": true,
    "headers": true,
    "javascript": true
  }
}
```

**Flat response** (`format=clay`):

```json
{
  "domain": "allbirds.com",
  "esp": "Iterable, Klaviyo",
  "esp_count": 2,
  "ecommerce": "Shopify",
  "ecommerce_count": 1,
  "analytics": "Google Analytics, Hotjar",
  "analytics_count": 2,
  "klaviyo": "Klaviyo + Shopify",
  "tech_score": 5,
  "tech_stack_primary": "Klaviyo",
  "tech_category": "Ecommerce Specialist",
  "cached": false,
  "duration_ms": 5200
}
```

### `POST /api/techstack/batch`

Detect tech stacks for multiple domains in parallel.

```bash
curl -X POST "http://localhost:3000/api/techstack/batch" \
  -H "Content-Type: application/json" \
  -d '{"domains": ["allbirds.com", "vuoriclothing.com"], "mode": "fast"}'
```

| Mode | Max domains | Concurrency | Speed |
|------|-------------|-------------|-------|
| `fast` | 500 | 50 | ~500ms/domain |
| `smart` | 200 | 20 | ~3-5s/domain avg |
| `full` | 20 | 5 | ~15s/domain |

### `POST /api/cache/clear`

Clear all cached results. Requires API key if authentication is enabled.

### `GET /health`

Health check (no auth required). Returns cache stats.

## Detection Modes

| Mode | How it works | Best for |
|------|-------------|----------|
| **full** | DNS + browser in parallel (default) | Maximum accuracy |
| **smart** | DNS first → browser only if tech score >= 15 | Balance of speed + accuracy |
| **fast** | DNS-only, no browser | Bulk processing, quick ESP lookup |

## Categories Detected

| Category | Examples |
|----------|----------|
| **ESP** | Klaviyo, Mailchimp, SendGrid, HubSpot, ActiveCampaign, Iterable, Customer.io, Brevo, +35 more |
| **CRM** | Salesforce, HubSpot, Zoho, Pipedrive, Freshsales, Microsoft Dynamics, +15 more |
| **Analytics** | Google Analytics, Mixpanel, Amplitude, Heap, Segment, Hotjar, FullStory, +10 more |
| **E-commerce** | Shopify, BigCommerce, Magento, WooCommerce, Salesforce Commerce Cloud, +7 more |
| **Marketing** | Facebook Pixel, TikTok, Pinterest, LinkedIn, Google Ads, Criteo, +10 more |
| **Chat** | Intercom, Drift, Zendesk, Gorgias, Tidio, LiveChat, +15 more |
| **A/B Testing** | Optimizely, VWO, AB Tasty, Dynamic Yield, LaunchDarkly, +5 more |
| **Tag Manager** | GTM, Adobe Launch, Tealium, Segment, +3 more |
| **CMS** | WordPress, Next.js, Nuxt.js, Webflow, Drupal, Squarespace, +8 more |
| **CDN** | Cloudflare, Fastly, Akamai, CloudFront, Bunny CDN, +10 more |
| **Payment** | Stripe, PayPal, Klarna, Affirm, Adyen, +7 more |
| **Hosting** | AWS, Google Cloud, Azure, Heroku, Vercel, Netlify, +15 more |

## Technographic Scoring

Each detection returns a `tech_score` (0-20) based on the primary ESP detected:

| Score | Category | Meaning |
|-------|----------|---------|
| **20** | SMB Email & Marketing Automation | Mailchimp, ActiveCampaign, Campaign Monitor, etc. |
| **15** | Email API / SMTP | SendGrid, Mailgun, Postmark, Amazon SES |
| **10** | Legacy / Mid-market Platforms | Emarsys, Dotdigital, Listrak, Sailthru |
| **5** | CDP / Sophisticated Stack | Braze, Iterable, Customer.io, Segment |
| **5** | Leading CRM Suite | HubSpot |
| **0** | Enterprise Marketing Suites | Salesforce Marketing Cloud, Marketo |

Special: **Klaviyo** scores 5 with Shopify (ecommerce specialist), 20 without (SMB email).

## Authentication

Set the `API_KEY` environment variable to enable authentication. If not set, all endpoints are open.

```bash
# With auth enabled
curl -H "X-API-Key: your-key" "http://localhost:3000/api/techstack?domain=example.com"

# Or via query param
curl "http://localhost:3000/api/techstack?domain=example.com&api_key=your-key"
```

## Docker

```bash
# Build
docker build -t techstack-api .

# Run
docker run -p 3000:3000 -e API_KEY=your-key techstack-api
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | — | API key for authentication (optional, auth disabled if not set) |
| `CACHE_TTL_HOURS` | `24` | Cache expiration in hours |

## Detection Methods

1. **DNS Records** — MX, TXT/SPF, CNAME lookups for ESP, CDN, hosting, and CRM detection
2. **HTML Analysis** — Script sources, meta tags, inline scripts, link hrefs
3. **HTTP Headers** — Server, X-Powered-By, X-CDN headers
4. **JavaScript Globals** — Runtime detection of 50+ known globals (Klaviyo, Shopify, GTM, etc.)

## Architecture

```
src/
├── index.js              # Express API server, endpoints, routing
├── services/
│   ├── detector.js       # Multi-method detection engine (DNS + Playwright)
│   ├── scoring.js        # Technographic scoring (0-20 pts)
│   ├── cache.js          # In-memory TTL cache
│   └── flatten.js        # Clay/CSV flat format converter
├── middleware/
│   └── auth.js           # Optional API key authentication
└── data/
    └── signatures.js     # 100+ technology detection signatures
```

## Performance Notes

- Browser recycled every 50 requests to prevent memory bloat
- DNS fallback when browser times out (partial results with `partial: true`)
- Smart mode skips browser for ~80% of domains → significant speed improvement
- In-memory cache avoids redundant lookups within TTL window

## Testing

```bash
npm test
```

Runs detection against 10 real domains and reports ESP detection rates, coverage, and timing.

## License

ISC
