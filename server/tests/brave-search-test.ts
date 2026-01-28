/**
 * Test script for Brave Search API integration
 * Run with: npx ts-node tests/brave-search-test.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testBraveSearch(): Promise<void> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  console.log('=== Brave Search API Test ===\n');

  if (!apiKey) {
    console.error('❌ BRAVE_SEARCH_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 8) + '...');

  const testQuery = 'AI proof of concept best practices 2024';
  console.log(`\n📝 Test query: "${testQuery}"\n`);

  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: testQuery,
        count: 5,
        text_decorations: false,
        search_lang: 'en',
        country: 'us',
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      timeout: 10000,
    });

    const webResults = response.data.web?.results || [];

    console.log('✅ API Response received');
    console.log(`   Status: ${response.status}`);
    console.log(`   Results found: ${webResults.length}`);
    console.log(`   Total available: ${response.data.web?.total || 'N/A'}\n`);

    console.log('--- Search Results ---\n');

    webResults.forEach((result: any, index: number) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Snippet: ${(result.description || '').substring(0, 100)}...`);
      if (result.age) console.log(`   Age: ${result.age}`);
      console.log('');
    });

    console.log('=== Test PASSED ✅ ===');
    console.log('\nBrave Search API is working correctly!');

  } catch (error: any) {
    console.error('❌ Test FAILED');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  }
}

testBraveSearch();
