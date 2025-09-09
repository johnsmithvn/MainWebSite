/**
 * Test script for Storage Quota Management
 * Chạy trong browser console để test các functions
 */

// Import functions (sẽ chạy trong browser context)
// import { checkStorageQuota, estimateChapterSize, checkStorageForDownload } from './storageQuota.js';

// Test data - mock chapter with sample URLs
const mockChapterUrls = [
  'https://example.com/manga/chapter1/page1.jpg',
  'https://example.com/manga/chapter1/page2.jpg',
  'https://example.com/manga/chapter1/page3.jpg',
  'https://example.com/manga/chapter1/page4.jpg',
  'https://example.com/manga/chapter1/page5.jpg'
];

// Test storage quota check
async function testStorageQuota() {
  console.log('🔍 Testing Storage Quota Check...');
  
  try {
    const storageInfo = await checkStorageQuota();
    console.log('📊 Storage Info:', storageInfo);
    
    if (storageInfo.supported) {
      console.log(`💾 Used: ${storageInfo.usageFormatted}`);
      console.log(`📦 Total: ${storageInfo.quotaFormatted}`);
      console.log(`🆓 Available: ${storageInfo.availableFormatted}`);
      console.log(`📈 Percentage: ${storageInfo.percentageFormatted}`);
    } else {
      console.log('⚠️ Storage API not supported');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test size estimation (mock version)
async function testSizeEstimation() {
  console.log('🔍 Testing Size Estimation...');
  
  // Mock function since we can't actually fetch in test
  const mockEstimateChapterSize = (urls) => {
    // Simulate 300KB per page
    return urls.length * 300 * 1024;
  };
  
  const estimatedSize = mockEstimateChapterSize(mockChapterUrls);
  const formatted = formatBytes(estimatedSize);
  
  console.log(`📏 Estimated size: ${formatted} (${mockChapterUrls.length} pages)`);
  return estimatedSize;
}

// Test download check (mock version)
async function testDownloadCheck() {
  console.log('🔍 Testing Download Check...');
  
  try {
    const storageInfo = await checkStorageQuota();
    const estimatedSize = await testSizeEstimation();
    
    // Simulate check logic
    const canDownload = estimatedSize < storageInfo.available;
    const afterDownloadPercentage = storageInfo.quota > 0 
      ? ((storageInfo.usage + estimatedSize) / storageInfo.quota) * 100
      : 0;
    
    console.log(`✅ Can download: ${canDownload}`);
    console.log(`📊 After download: ${Math.round(afterDownloadPercentage)}%`);
    
    if (afterDownloadPercentage >= 95) {
      console.log('🚨 Would exceed critical threshold!');
    } else if (afterDownloadPercentage >= 90) {
      console.log('⚠️ Would exceed warning threshold!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Utility function
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return bytes + ' B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Storage Quota Tests...');
  console.log('=====================================');
  
  await testStorageQuota();
  console.log('');
  
  await testSizeEstimation();
  console.log('');
  
  await testDownloadCheck();
  console.log('');
  
  console.log('✅ All tests completed!');
}

// Instructions for manual testing
console.log(`
📝 Manual Testing Instructions:

1. Open browser DevTools Console
2. Navigate to Manga Reader page
3. Copy and paste this entire script
4. Run: runAllTests()
5. Check for any errors or warnings

🔧 Individual Tests:
- testStorageQuota() - Check current storage info
- testSizeEstimation() - Test size calculation
- testDownloadCheck() - Test download validation

💡 To test actual storage quota functionality:
- Try downloading a chapter
- Check console for storage quota logs
- Verify modal appears when storage is low

🎯 Expected Behavior:
- Storage info should show current usage
- Estimation should calculate reasonable size
- Download check should prevent when quota exceeded
`);

// Auto-run if wanted
// runAllTests();

export { 
  testStorageQuota, 
  testSizeEstimation, 
  testDownloadCheck, 
  runAllTests,
  mockChapterUrls,
  formatBytes
};
