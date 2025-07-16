/**
 * APEX AI FACE RECOGNITION API TESTING SUITE
 * ==========================================
 * Comprehensive live simulation of Face Recognition API endpoints
 * 
 * This script tests all API endpoints without requiring user interaction
 * and provides detailed feedback on system functionality.
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Adjust if different
const TEST_IMAGE_PATH = path.join(__dirname, 'test_face_image.jpg');

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function logTest(testName, status, details = '') {
  testResults.total++;
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  
  console.log(`[${timestamp}] ${statusIcon} ${testName}`);
  if (details) {
    console.log(`    Details: ${details}`);
  }
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
}

function createTestImage() {
  // Create a simple test image (1x1 pixel PNG)
  const testImageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF,
    0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE5,
    0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  try {
    fs.writeFileSync(TEST_IMAGE_PATH, testImageData);
    return true;
  } catch (error) {
    console.error('Failed to create test image:', error.message);
    return false;
  }
}

// API Test Functions
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'online') {
      logTest('API Health Check', 'PASS', `API is online, version: ${data.version}`);
      return true;
    } else {
      logTest('API Health Check', 'FAIL', `Health check failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('API Health Check', 'FAIL', `Network error: ${error.message}`);
    return false;
  }
}

async function testFaceEnrollment() {
  try {
    // Create test image if it doesn't exist
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      if (!createTestImage()) {
        logTest('Face Enrollment - Image Creation', 'FAIL', 'Could not create test image');
        return null;
      }
    }
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('name', 'Test User API');
    formData.append('department', 'Testing');
    formData.append('access_level', 'Standard');
    formData.append('notes', 'Automated API test enrollment');
    
    const response = await fetch(`${API_BASE_URL}/api/face/enroll`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      logTest('Face Enrollment', 'PASS', `Face enrolled with ID: ${data.data.face_id}`);
      return data.data.face_id;
    } else {
      logTest('Face Enrollment', 'FAIL', `Enrollment failed: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logTest('Face Enrollment', 'FAIL', `Network error: ${error.message}`);
    return null;
  }
}

async function testFaceProfilesList() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/faces?limit=10&status=active`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const profileCount = data.data.faces.length;
      const totalCount = data.data.pagination.total;
      logTest('Face Profiles List', 'PASS', `Retrieved ${profileCount} profiles (${totalCount} total)`);
      return data.data.faces;
    } else {
      logTest('Face Profiles List', 'FAIL', `List failed: ${data.error || 'Unknown error'}`);
      return [];
    }
  } catch (error) {
    logTest('Face Profiles List', 'FAIL', `Network error: ${error.message}`);
    return [];
  }
}

async function testFaceProfileDetails(faceId) {
  if (!faceId) {
    logTest('Face Profile Details', 'SKIP', 'No face ID available');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/faces/${faceId}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      logTest('Face Profile Details', 'PASS', `Retrieved profile for: ${data.data.name}`);
    } else {
      logTest('Face Profile Details', 'FAIL', `Details failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Face Profile Details', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testFaceAnalytics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/faces/analytics/summary?days=30`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const analytics = data.analytics;
      const profileCount = analytics.profile_summary.reduce((sum, p) => sum + p.count, 0);
      const detectionCount = analytics.detection_trends.reduce((sum, d) => sum + d.total_detections, 0);
      
      logTest('Face Analytics', 'PASS', `${profileCount} profiles, ${detectionCount} detections analyzed`);
    } else {
      logTest('Face Analytics', 'FAIL', `Analytics failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Face Analytics', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testFaceDetections() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/faces/detections?hours=24&limit=20`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      const detectionCount = data.data.detections.length;
      const knownDetections = data.data.detections.filter(d => d.is_match).length;
      const unknownDetections = detectionCount - knownDetections;
      
      logTest('Face Detections Log', 'PASS', 
        `Retrieved ${detectionCount} detections (${knownDetections} known, ${unknownDetections} unknown)`);
    } else {
      logTest('Face Detections Log', 'FAIL', `Detections failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Face Detections Log', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testSearchAndFiltering() {
  try {
    // Test search functionality
    const searchResponse = await fetch(`${API_BASE_URL}/api/faces?search=Security&limit=5`);
    const searchData = await searchResponse.json();
    
    if (searchResponse.ok && searchData.success) {
      logTest('Search Functionality', 'PASS', 
        `Found ${searchData.data.faces.length} profiles matching 'Security'`);
    } else {
      logTest('Search Functionality', 'FAIL', `Search failed: ${searchData.error || 'Unknown error'}`);
    }
    
    // Test department filtering
    const filterResponse = await fetch(`${API_BASE_URL}/api/faces?department=Security&limit=5`);
    const filterData = await filterResponse.json();
    
    if (filterResponse.ok && filterData.success) {
      logTest('Department Filtering', 'PASS', 
        `Found ${filterData.data.faces.length} profiles in Security department`);
    } else {
      logTest('Department Filtering', 'FAIL', `Filter failed: ${filterData.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Search and Filtering', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testErrorHandling() {
  try {
    // Test invalid face ID
    const invalidResponse = await fetch(`${API_BASE_URL}/api/faces/invalid-face-id`);
    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 404 && !invalidData.success) {
      logTest('Error Handling - Invalid ID', 'PASS', 'Properly returned 404 for invalid face ID');
    } else {
      logTest('Error Handling - Invalid ID', 'FAIL', 'Did not handle invalid face ID properly');
    }
    
    // Test enrollment without image
    const noImageResponse = await fetch(`${API_BASE_URL}/api/face/enroll`, {
      method: 'POST',
      body: new FormData()
    });
    const noImageData = await noImageResponse.json();
    
    if (noImageResponse.status === 400 && !noImageData.success) {
      logTest('Error Handling - No Image', 'PASS', 'Properly rejected enrollment without image');
    } else {
      logTest('Error Handling - No Image', 'FAIL', 'Did not handle missing image properly');
    }
  } catch (error) {
    logTest('Error Handling Tests', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testFaceDeletion(faceId) {
  if (!faceId) {
    logTest('Face Deletion', 'SKIP', 'No face ID available');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/faces/${faceId}?permanent=false`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      logTest('Face Deletion (Archive)', 'PASS', 'Successfully archived test face profile');
    } else {
      logTest('Face Deletion (Archive)', 'FAIL', `Deletion failed: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Face Deletion (Archive)', 'FAIL', `Network error: ${error.message}`);
  }
}

async function testPaginationAndLimits() {
  try {
    // Test pagination
    const page1Response = await fetch(`${API_BASE_URL}/api/faces?limit=3&offset=0`);
    const page1Data = await page1Response.json();
    
    const page2Response = await fetch(`${API_BASE_URL}/api/faces?limit=3&offset=3`);
    const page2Data = await page2Response.json();
    
    if (page1Response.ok && page2Response.ok && 
        page1Data.success && page2Data.success) {
      const totalPage1 = page1Data.data.faces.length;
      const totalPage2 = page2Data.data.faces.length;
      
      logTest('Pagination', 'PASS', `Page 1: ${totalPage1} items, Page 2: ${totalPage2} items`);
    } else {
      logTest('Pagination', 'FAIL', 'Pagination requests failed');
    }
  } catch (error) {
    logTest('Pagination', 'FAIL', `Network error: ${error.message}`);
  }
}

// Performance testing
async function testAPIPerformance() {
  try {
    const startTime = Date.now();
    const promises = [];
    
    // Run multiple concurrent requests
    for (let i = 0; i < 5; i++) {
      promises.push(fetch(`${API_BASE_URL}/api/faces?limit=10`));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const allSuccessful = responses.every(r => r.ok);
    
    if (allSuccessful) {
      logTest('API Performance', 'PASS', `5 concurrent requests completed in ${totalTime}ms`);
    } else {
      logTest('API Performance', 'FAIL', `Some concurrent requests failed`);
    }
  } catch (error) {
    logTest('API Performance', 'FAIL', `Performance test error: ${error.message}`);
  }
}

// Main test execution
async function runFaceRecognitionAPITests() {
  console.log('\n🧪 APEX AI FACE RECOGNITION API TESTING SUITE');
  console.log('='.repeat(60));
  console.log(`Starting comprehensive API tests at ${new Date().toISOString()}`);
  console.log(`Target API: ${API_BASE_URL}`);
  console.log('='.repeat(60));
  
  // Step 1: Basic connectivity
  console.log('\n📡 TESTING API CONNECTIVITY');
  const apiHealthy = await testHealthEndpoint();
  
  if (!apiHealthy) {
    console.log('\n❌ API is not responding. Please ensure the backend server is running.');
    console.log('   Run: npm run dev in the backend directory');
    return;
  }
  
  // Step 2: Core functionality tests
  console.log('\n🎯 TESTING CORE FACE RECOGNITION FUNCTIONALITY');
  
  // Test face enrollment
  const enrolledFaceId = await testFaceEnrollment();
  
  // Test face profiles listing
  const profiles = await testFaceProfilesList();
  
  // Test individual profile details
  if (profiles.length > 0) {
    await testFaceProfileDetails(profiles[0].face_id);
  }
  
  // Step 3: Analytics and detection tests
  console.log('\n📊 TESTING ANALYTICS AND DETECTION ENDPOINTS');
  await testFaceAnalytics();
  await testFaceDetections();
  
  // Step 4: Search and filtering
  console.log('\n🔍 TESTING SEARCH AND FILTERING');
  await testSearchAndFiltering();
  
  // Step 5: Pagination and limits
  console.log('\n📄 TESTING PAGINATION');
  await testPaginationAndLimits();
  
  // Step 6: Error handling
  console.log('\n⚠️ TESTING ERROR HANDLING');
  await testErrorHandling();
  
  // Step 7: Performance testing
  console.log('\n⚡ TESTING API PERFORMANCE');
  await testAPIPerformance();
  
  // Step 8: Cleanup (delete test face)
  console.log('\n🧹 TESTING CLEANUP OPERATIONS');
  if (enrolledFaceId) {
    await testFaceDeletion(enrolledFaceId);
  }
  
  // Clean up test image
  try {
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH);
    }
  } catch (error) {
    console.log(`Note: Could not clean up test image: ${error.message}`);
  }
  
  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.details}`);
    });
  }
  
  const overallStatus = testResults.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED';
  console.log(`\n${overallStatus}`);
  console.log(`Face Recognition API Testing completed at ${new Date().toISOString()}\n`);
  
  // Return results for potential programmatic use
  return {
    success: testResults.failed === 0,
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    errors: testResults.errors
  };
}

// Export for use as module or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFaceRecognitionAPITests().catch(console.error);
}

export default runFaceRecognitionAPITests;
