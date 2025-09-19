// Comprehensive test suite for ProspectPro Edge Functions
// Tests both business discovery and lead validation

interface TestCase {
  name: string;
  description: string;
  request: any;
  expectedFields: string[];
}

// Test business discovery
async function testBusinessDiscovery() {
  console.log('🔍 Testing Business Discovery Edge Function');
  console.log('═'.repeat(50));

  const testCases: TestCase[] = [
    {
      name: 'Valid Restaurant Search',
      description: 'Search for restaurants in San Francisco',
      request: {
        query: 'restaurants',
        location: 'San Francisco, CA',
        maxResults: 3
      },
      expectedFields: ['query', 'businesses', 'qualifiedResults', 'estimatedCost']
    },
    {
      name: 'Missing Location Error',
      description: 'Test error handling for missing location',
      request: {
        query: 'restaurants'
      },
      expectedFields: ['error']
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}: ${testCase.description}`);
    
    try {
      const response = await fetch('http://localhost:8080/business-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.request)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Results: ${result.qualifiedResults || 0} qualified businesses`);
        if (result.businesses && result.businesses.length > 0) {
          console.log(`📋 Sample: ${result.businesses[0].name} (${result.businesses[0].confidence}% confidence)`);
        }
      } else {
        console.log(`⚠️  Expected error: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${(error as Error).message}`);
    }
  }
}

// Test lead validation  
async function testLeadValidation() {
  console.log('\n🔍 Testing Lead Validation Edge Function');
  console.log('═'.repeat(50));

  const testCases: TestCase[] = [
    {
      name: 'Valid Lead Validation',
      description: 'Validate leads with websites, emails, phones',
      request: {
        leads: [
          {
            id: '1',
            name: 'Test Restaurant',
            website: 'https://google.com',
            email: 'test@gmail.com',
            phone: '(555) 123-4567',
            address: '123 Main St'
          },
          {
            id: '2', 
            name: 'Test Cafe',
            website: 'invalid-url',
            email: 'invalid-email',
            phone: '123',
            address: '456 Oak St'
          }
        ]
      },
      expectedFields: ['totalLeads', 'qualifiedLeads', 'results']
    },
    {
      name: 'Skip Website Check',
      description: 'Test with website validation disabled',
      request: {
        leads: [
          {
            id: '3',
            name: 'Quick Test',
            email: 'test@example.com',
            phone: '5551234567'
          }
        ],
        skipWebsiteCheck: true
      },
      expectedFields: ['totalLeads', 'results']
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}: ${testCase.description}`);
    
    try {
      const response = await fetch('http://localhost:8080/lead-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.request)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Results: ${result.qualifiedLeads}/${result.totalLeads} leads qualified`);
        console.log(`📈 Qualification rate: ${result.qualificationRate}%`);
        
        if (result.results && result.results.length > 0) {
          const sample = result.results[0];
          console.log(`📋 Sample: ${sample.name} - Score: ${sample.overallScore}% (${sample.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'})`);
        }
      } else {
        console.log(`⚠️  Expected error: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Test failed: ${(error as Error).message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🎯 ProspectPro Edge Functions Test Suite');
  console.log('🚀 Testing zero fake data lead processing pipeline\n');
  
  await testBusinessDiscovery();
  await testLeadValidation();
  
  console.log('\n🏁 Test Suite Complete!');
  console.log('📝 Next Steps:');
  console.log('   1. Deploy to Supabase: npx supabase functions deploy');
  console.log('   2. Test in production environment'); 
  console.log('   3. Integrate with main ProspectPro application');
}

if (import.meta.main) {
  await runAllTests();
}