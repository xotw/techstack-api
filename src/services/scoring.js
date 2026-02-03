/**
 * Technographic scoring based on ESP/marketing stack
 * 20 pts max - higher = easier to sell against
 */

const SCORING_RULES = {
  // 20 pts - SMB Email & Marketing Automation (direct competitors, highest win rate)
  20: {
    category: 'SMB Email & Marketing Automation',
    vendors: [
      'Mailchimp', 'ActiveCampaign', 'Campaign Monitor', 'Constant Contact',
      'GetResponse', 'MailerLite', 'Omnisend', 'Mailjet', 'Moosend',
      'AWeber', 'ConvertKit', 'Drip', 'Benchmark Email'
    ]
  },

  // 15 pts - Email API / SMTP Providers (transactional-only, can upsell marketing)
  15: {
    category: 'Email API / SMTP Providers',
    vendors: [
      'SendGrid', 'Mailgun', 'Postmark', 'SparkPost', 'Amazon SES', 'Mandrill'
    ]
  },

  // 10 pts - Legacy platforms (Brevo can win, decent chance)
  10: {
    category: 'Legacy Platforms',
    vendors: [
      'Oracle Eloqua', 'Emarsys', 'Dotdigital', 'Listrak', 'Sailthru'
    ]
  },

  // 5 pts - CDP (sophisticated stack, harder sell)
  5: {
    category: 'CDP / Sophisticated Stack',
    vendors: [
      'Braze', 'Segment', 'mParticle', 'Iterable', 'Customer.io', 'Cordial', 'Bluecore'
    ]
  },

  // 5 pts - Leading CRM Suite
  // Note: HubSpot detected = harder sell
  5.1: {
    category: 'Leading CRM Suite',
    vendors: [
      'HubSpot'
    ]
  },

  // 0 pts - Enterprise Marketing Suites (very hard to displace)
  0: {
    category: 'Enterprise Marketing Suites',
    vendors: [
      'Salesforce Marketing Cloud', 'Adobe Marketo Engage', 'Marketo',
      'Microsoft Dynamics 365 Marketing', 'Microsoft Dynamics'
    ]
  }
};

// Special case: Klaviyo scoring depends on Shopify
const KLAVIYO_RULES = {
  withShopify: { score: 5, category: 'Ecommerce Specialist' },
  withoutShopify: { score: 20, category: 'SMB Email & Marketing Automation' }
};

// Vendors to ignore (corporate email, not marketing)
const IGNORE_VENDORS = [
  'Google Workspace', 'Microsoft 365', 'Zoho', 'Proofpoint', 'Mimecast', 'Barracuda'
];

/**
 * Calculate tech stack score from detection results
 */
export function calculateTechScore(detectionResult) {
  const esps = detectionResult.esp || [];
  const ecommerce = detectionResult.ecommerce || [];

  // Check if Shopify is detected
  const hasShopify = ecommerce.some(e =>
    e.name.toLowerCase().includes('shopify')
  );

  // Filter out corporate email providers
  const marketingEsps = esps.filter(esp =>
    !IGNORE_VENDORS.includes(esp.name)
  );

  if (marketingEsps.length === 0) {
    // No marketing ESP - show corporate email as fallback
    const corporateEmail = esps.length > 0 ? esps[0].name : null;
    return {
      tech_score: 10,
      tech_stack_primary: corporateEmail,
      tech_category: corporateEmail ? 'Corporate Email Only' : 'No tech found'
    };
  }

  let maxScore = -1;
  let primaryVendor = null;
  let primaryCategory = null;

  for (const esp of marketingEsps) {
    const vendorName = esp.name;

    // Special handling for Klaviyo
    if (vendorName === 'Klaviyo') {
      const klaviyoScore = hasShopify ? KLAVIYO_RULES.withShopify : KLAVIYO_RULES.withoutShopify;
      if (klaviyoScore.score > maxScore) {
        maxScore = klaviyoScore.score;
        primaryVendor = 'Klaviyo';
        primaryCategory = klaviyoScore.category;
      }
      continue;
    }

    // Check against scoring rules
    for (const [scoreStr, rule] of Object.entries(SCORING_RULES)) {
      const score = parseFloat(scoreStr);
      if (rule.vendors.includes(vendorName)) {
        if (score > maxScore || (score === maxScore && !primaryVendor)) {
          maxScore = Math.floor(score); // Handle 5.1 -> 5
          primaryVendor = vendorName;
          primaryCategory = rule.category;
        }
        break;
      }
    }
  }

  // If no scoring match found, default to 10
  if (maxScore === -1) {
    return {
      tech_score: 10,
      tech_stack_primary: marketingEsps[0]?.name || null,
      tech_category: 'Unknown / Other'
    };
  }

  return {
    tech_score: maxScore,
    tech_stack_primary: primaryVendor,
    tech_category: primaryCategory
  };
}
