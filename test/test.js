/**
 * Test script for tech stack detection
 * Tests against domains that returned "Unknown" for ESP in Brevo
 */

import { detectTechStack } from '../src/services/detector.js';
import fs from 'fs';
import path from 'path';

// Test domains from the user's CSV (these all returned "Unknown" for ESP in Brevo)
const TEST_DOMAINS = [
  'aloyoga.com',
  'converse.com',
  'vuoriclothing.com',
  'oakley.com',
  'walmart.com',
  'hoka.com',
  'jcrew.com',
  'liquiddeath.com',
  'allbirds.com',
  'thereformation.com'
];

async function runTests() {
  console.log('🔍 Tech Stack Detection API - Test Suite\n');
  console.log('Testing domains that returned "Unknown" for ESP in Brevo...\n');
  console.log('='.repeat(70));

  const results = [];

  for (const domain of TEST_DOMAINS) {
    console.log(`\n📡 Testing: ${domain}`);
    console.log('-'.repeat(50));

    try {
      const startTime = Date.now();
      const result = await detectTechStack(domain);
      const duration = Date.now() - startTime;

      console.log(`  ⏱️  Detection time: ${duration}ms`);

      // ESP Results
      if (result.esp?.length > 0) {
        console.log(`  ✅ ESP: ${result.esp.map(e => `${e.name} (${e.confidence})`).join(', ')}`);
      } else {
        console.log(`  ❌ ESP: Not detected`);
      }

      // E-commerce
      if (result.ecommerce?.length > 0) {
        console.log(`  🛒 E-commerce: ${result.ecommerce.map(e => e.name).join(', ')}`);
      }

      // Analytics
      if (result.analytics?.length > 0) {
        console.log(`  📊 Analytics: ${result.analytics.map(e => e.name).join(', ')}`);
      }

      // Marketing
      if (result.marketing?.length > 0) {
        console.log(`  📣 Marketing: ${result.marketing.map(e => e.name).join(', ')}`);
      }

      // Chat
      if (result.chat?.length > 0) {
        console.log(`  💬 Chat: ${result.chat.map(e => e.name).join(', ')}`);
      }

      // CDN
      if (result.cdn?.length > 0) {
        console.log(`  🌐 CDN: ${result.cdn.map(e => e.name).join(', ')}`);
      }

      results.push({
        domain,
        success: true,
        duration,
        esp: result.esp,
        ecommerce: result.ecommerce,
        analytics: result.analytics
      });

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      results.push({
        domain,
        success: false,
        error: err.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY\n');

  const successful = results.filter(r => r.success);
  const withESP = successful.filter(r => r.esp?.length > 0);
  const withEcommerce = successful.filter(r => r.ecommerce?.length > 0);

  console.log(`Total domains tested: ${TEST_DOMAINS.length}`);
  console.log(`Successful detections: ${successful.length}`);
  console.log(`ESP detected: ${withESP.length} (${Math.round(withESP.length / successful.length * 100)}%)`);
  console.log(`E-commerce detected: ${withEcommerce.length}`);

  // ESP breakdown
  if (withESP.length > 0) {
    console.log('\n📧 ESP Breakdown:');
    const espCounts = {};
    for (const r of withESP) {
      for (const esp of r.esp) {
        espCounts[esp.name] = (espCounts[esp.name] || 0) + 1;
      }
    }
    for (const [name, count] of Object.entries(espCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${name}: ${count}`);
    }
  }

  // Average detection time
  const avgTime = Math.round(successful.reduce((sum, r) => sum + r.duration, 0) / successful.length);
  console.log(`\n⏱️  Average detection time: ${avgTime}ms`);
}

runTests().catch(console.error);
