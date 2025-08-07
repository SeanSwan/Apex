/**
 * UPDATED SYSTEM STATUS CHECK - PORT 5000
 * =======================================
 * Check if backend server is running on the correct port
 */

console.log('🔍 APEX AI SYSTEM STATUS CHECK (Updated for Port 5000)');
console.log('='.repeat(60));

async function checkBackendServer() {
  console.log('\n📡 Checking Backend Server on Port 5000...');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend server is RUNNING on port 5000');
      console.log(`✅ Face Recognition feature: ${data.features?.face_recognition ? 'ENABLED' : 'DISABLED'}`);
      console.log(`📊 Server version: ${data.version || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ Backend server responding but unhealthy (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend server not accessible on port 5000');
    console.log('💡 Make sure server is running with: npm run dev');
    return false;
  }
}

async function checkFaceAPI() {
  console.log('\n🧠 Checking Face Recognition API on Port 5000...');
  
  try {
    const response = await fetch('http://localhost:5000/api/faces');
    
    if (response.ok || response.status === 404) {
      console.log('✅ Face Recognition API is accessible');
      if (response.status === 404) {
        console.log('📝 No faces enrolled yet (expected for new system)');
      }
      return true;
    } else {
      console.log(`❌ Face Recognition API error (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log('❌ Face Recognition API not accessible');
    return false;
  }
}

async function checkFrontendPort() {
  console.log('\n🌐 Checking Frontend Application...');
  
  // Try port 3000 first (common frontend port)
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Frontend running on port 3000');
      console.log('🎯 Face Management URL: http://localhost:3000/face-management');
      return 3000;
    }
  } catch (error) {
    // Frontend not on 3000, try 5000
  }
  
  // Try port 5000 (same as backend)
  try {
    const response = await fetch('http://localhost:5000');
    if (response.ok) {
      console.log('✅ Frontend running on port 5000 (same as backend)');
      console.log('🎯 Face Management URL: http://localhost:5000/face-management');
      return 5000;
    }
  } catch (error) {
    console.log('⚠️ Frontend not detected on common ports');
    console.log('💡 You may need to start the frontend separately');
    return null;
  }
}

async function runStatusCheck() {
  const backendOk = await checkBackendServer();
  const faceApiOk = await checkFaceAPI();
  const frontendPort = await checkFrontendPort();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYSTEM STATUS SUMMARY');
  console.log('='.repeat(60));
  
  if (backendOk && faceApiOk) {
    console.log('🟢 BACKEND SYSTEMS OPERATIONAL');
    console.log('✅ Backend API running on port 5000');
    console.log('✅ Face Recognition API accessible');
    console.log('✅ Ready for database setup and testing');
    
    if (frontendPort) {
      console.log(`✅ Frontend accessible on port ${frontendPort}`);
      console.log(`\n🎯 ACCESS FACE MANAGEMENT: http://localhost:${frontendPort}/face-management`);
    } else {
      console.log('\n⚠️ Frontend not detected - you may need to start it separately');
      console.log('💡 Try: npm run dev (in frontend directory)');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. 🗄️ Run database setup: node setup_face_recognition_database.mjs');
    console.log('2. 🧪 Run integration tests: node test_face_recognition_integration.mjs');
    
  } else {
    console.log('🟡 SOME ISSUES DETECTED');
    console.log('\n🔧 ISSUES FOUND:');
    
    if (!backendOk) {
      console.log('❌ Backend server not responding on port 5000');
      console.log('💡 Check if server is running with: npm run dev');
    }
    if (!faceApiOk) {
      console.log('❌ Face Recognition API not accessible');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

runStatusCheck().catch(console.error);
