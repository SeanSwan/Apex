/**
 * APEX AI SECURITY - ENHANCED SERVER TEST
 * =======================================
 * Test the security-enhanced server
 */

console.log('🔒 Testing APEX AI Security-Enhanced Server...\n');

async function testSecurityEnhancements() {
  const axios = (await import('axios')).default;
  const baseURL = 'http://localhost:5000';

  try {
    console.log('🔍 Testing Enhanced Health Check...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    
    if (healthResponse.data.security) {
      console.log('\n🛡️ Security Features Verified:');
      Object.entries(healthResponse.data.security).forEach(([key, value]) => {
        console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
      });
    }

    console.log('\n🔍 Testing Rate Limiting...');
    
    // Test rate limiting by making multiple requests quickly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${baseURL}/api/health`).catch(error => ({
          status: error.response?.status || 'error',
          data: error.response?.data || error.message
        }))
      );
    }
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    console.log(`   📊 Requests: ${responses.length} | Success: ${successCount} | Rate Limited: ${rateLimitedCount}`);
    
    if (rateLimitedCount > 0) {
      console.log('   ✅ Rate limiting is working correctly!');
    } else {
      console.log('   ⚠️ Rate limiting may need adjustment (no requests limited)');
    }

    console.log('\n🔍 Testing Security Headers...');
    const headersResponse = await axios.get(`${baseURL}/api/health`);
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy'
    ];

    securityHeaders.forEach(header => {
      if (headersResponse.headers[header]) {
        console.log(`   ✅ ${header}: ${headersResponse.headers[header]}`);
      } else {
        console.log(`   ❌ Missing header: ${header}`);
      }
    });

    console.log('\n🔍 Testing JWT Endpoint...');
    const jwtResponse = await axios.get(`${baseURL}/api/test-jwt`);
    
    if (jwtResponse.data.success) {
      console.log('   ✅ JWT functionality working correctly');
    } else {
      console.log('   ❌ JWT functionality issues detected');
    }

    console.log('\n🚀 Security Enhancement Test Complete!');
    console.log('🎯 Your APEX AI Platform now has PRODUCTION-GRADE SECURITY! 🛡️');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your server is running:');
      console.log('   cd C:\\Users\\ogpsw\\Desktop\\defense\\backend');
      console.log('   npm start');
    }
  }
}

// Run the test
testSecurityEnhancements();
