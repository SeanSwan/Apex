/**
 * QUICK SYSTEM STATUS CHECK
 * =========================
 * Check if backend server is running and database is accessible
 */

console.log('🔍 APEX AI SYSTEM STATUS CHECK');
console.log('='.repeat(50));

async function checkBackendServer() {
  console.log('\n📡 Checking Backend Server...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend server is RUNNING');
      console.log(`✅ Face Recognition feature: ${data.features?.face_recognition ? 'ENABLED' : 'DISABLED'}`);
      console.log(`📊 Server version: ${data.version || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ Backend server responding but unhealthy (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend server is NOT RUNNING');
    console.log('💡 Start it with: npm run dev (in backend directory)');
    return false;
  }
}

async function checkFaceAPI() {
  console.log('\n🧠 Checking Face Recognition API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/faces');
    
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

async function checkDatabaseDependencies() {
  console.log('\n🗄️ Checking Database Dependencies...');
  
  try {
    const pkg = await import('pg');
    console.log('✅ PostgreSQL (pg) module is installed');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL (pg) module is NOT installed');
    console.log('💡 Install with: npm install pg');
    console.log('💡 Also install types: npm install @types/pg');
    return false;
  }
}

async function runStatusCheck() {
  const backendOk = await checkBackendServer();
  const faceApiOk = await checkFaceAPI();
  const dbDepsOk = await checkDatabaseDependencies();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYSTEM STATUS SUMMARY');
  console.log('='.repeat(50));
  
  if (backendOk && faceApiOk && dbDepsOk) {
    console.log('🟢 ALL SYSTEMS OPERATIONAL');
    console.log('✅ Ready for database setup and testing');
    console.log('\n🎯 Next: Run database setup again');
  } else {
    console.log('🟡 SOME ISSUES DETECTED');
    console.log('\n🔧 REQUIRED ACTIONS:');
    
    if (!backendOk) {
      console.log('1. ⚠️ Start backend server: cd backend && npm run dev');
    }
    if (!dbDepsOk) {
      console.log('2. ⚠️ Install PostgreSQL module: npm install pg @types/pg');
    }
    
    console.log('\n💡 Then re-run: node setup_face_recognition_database.mjs');
  }
  
  console.log('\n' + '='.repeat(50));
}

runStatusCheck().catch(console.error);
