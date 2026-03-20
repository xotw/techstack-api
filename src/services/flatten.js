/**
 * Flatten detection results for Clay / CSV compatibility.
 * Turns nested arrays into comma-separated strings for easy column mapping.
 */

const CATEGORIES = [
  'esp', 'crm', 'cms', 'ecommerce', 'analytics',
  'marketing', 'chat', 'ab_testing', 'tag_manager',
  'payment', 'cdn', 'hosting'
];

/**
 * Convert a full detection result into a flat key-value object.
 *
 * Input:  { esp: [{name:"Klaviyo", confidence:"high", source:"js"}], tech_score: 20, ... }
 * Output: { esp: "Klaviyo", esp_count: 1, tech_score: 20, ... }
 */
export function flattenForClay(result) {
  const flat = {
    domain: result.domain,
  };

  for (const cat of CATEGORIES) {
    const items = result[cat] || [];
    flat[cat] = items.map(i => i.name).join(', ') || null;
    flat[`${cat}_count`] = items.length;
  }

  // Klaviyo special mention (useful for Shopify ecosystem analysis)
  const hasKlaviyo = (result.esp || []).some(i => i.name === 'Klaviyo');
  const hasShopify = (result.ecommerce || []).some(i => i.name?.toLowerCase().includes('shopify'));

  if (hasKlaviyo) {
    flat.klaviyo = hasShopify ? 'Klaviyo + Shopify' : 'Klaviyo Standalone';
  } else {
    flat.klaviyo = null;
  }

  flat.tech_score = result.tech_score ?? null;
  flat.tech_stack_primary = result.tech_stack_primary ?? null;
  flat.tech_category = result.tech_category ?? null;
  flat.cached = result.cached ?? false;
  flat.duration_ms = result.duration_ms ?? null;

  return flat;
}
