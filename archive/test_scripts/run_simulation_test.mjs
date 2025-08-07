/**
 * EXECUTE PHASE 1 SIMULATION TEST
 * ===============================
 * Run the comprehensive face detection simulation
 */

// Import the test function
import runPhase1Testing from './test_phase1_face_detection.mjs';

console.log('🚀 Starting Phase 1 Face Detection Simulation...\n');

// Execute the test
runPhase1Testing()
  .then(report => {
    console.log('\n✅ Phase 1 Simulation completed successfully!');
    console.log('📊 Simulation validated Face Detection system capabilities');
  })
  .catch(error => {
    console.error('\n❌ Phase 1 Simulation failed:', error.message);
  });
