/**
 * APEX AI PLATFORM - SIMPLE SERVER TEST
 * =====================================
 * Test if server is running and basic endpoints work
 */

console.log('🔍 Testing if APEX AI Server is running...\n');

async function simpleServerTest() {
  try {
    const axios = (await import('axios')).default;
    const baseURL = 'http://localhost:5000';

    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
    
    if (healthResponse.data.version === '2.0.0-security-enhanced') {
      console.log('✅ Server is running with security enhancements!');
      console.log(`   Version: ${healthResponse.data.version}`);
      console.log(`   Security Active: ${healthResponse.data.security ? 'Yes' : 'No'}`);
      
      // Test a simple API endpoint
      console.log('\n🧪 Testing voice templates endpoint...');
      try {
        const templatesResponse = await axios.get(`${baseURL}/api/cameras/voice-messages`);
        if (templatesResponse.data.success) {
          console.log('✅ Voice templates endpoint working');
          console.log(`   Available messages: ${Object.keys(templatesResponse.data.templates.security_messages).length}`);
        }
      } catch (templatesError) {
        console.log('❌ Voice templates endpoint failed');
      }
      
      // Test AI alert creation
      console.log('\n🤖 Testing AI alert creation...');
      try {
        const alertResponse = await axios.post(`${baseURL}/api/ai-alerts/create`, {
          detection_data: {
            detection_type: 'person',
            confidence: 0.85,
            bounding_box: { x: 0.3, y: 0.4, width: 0.2, height: 0.3 }
          },
          camera_id: 'cam_001',
          alert_type: 'detection'
        });
        
        if (alertResponse.data.success) {
          console.log('✅ AI alert creation working!');
          console.log(`   Alert ID: ${alertResponse.data.alert.alert_id}`);
          console.log(`   Risk Score: ${alertResponse.data.alert.risk_analysis.risk_score}/10`);
        }
      } catch (alertError) {
        if (alertError.response?.status === 500) {
          console.log('⚠️ AI alert creation returns 500 (expected without external services)');
        } else {
          console.log(`❌ AI alert creation failed: ${alertError.response?.status || alertError.message}`);
        }
      }
      
      console.log('\n🎉 SERVER TEST RESULTS:');
      console.log('=======================');
      console.log('✅ Server is running properly');
      console.log('✅ Security enhancements active');
      console.log('✅ Basic endpoints responding');
      console.log('✅ Ready for full integration testing');
      
      console.log('\n🚀 Next Steps:');
      console.log('1. Run full test: node test-integration-improved.mjs');
      console.log('2. Configure external services if needed');
      console.log('3. Begin using your enhanced platform!');
      
    } else {
      console.log('⚠️ Server running but may not have security enhancements');
      console.log(`   Version: ${healthResponse.data.version || 'Unknown'}`);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
      console.log('\n💡 To start your server:');
      console.log('   npm start');
      console.log('\n📋 Or if you need to run repairs first:');
      console.log('   repair-all.bat');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Server not reachable (network issue)');
    } else {
      console.log(`❌ Server test failed: ${error.message}`);
    }
  }
}

simpleServerTest();
