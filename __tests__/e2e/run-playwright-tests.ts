import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const testsDir = path.join(__dirname);
const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.spec.ts'));

console.log('🎭 BlindsCommerce Playwright E2E Test Suite');
console.log('==========================================\n');

console.log(`Found ${testFiles.length} test files:`);
testFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\n🚀 Starting test execution...\n');

// Test results summary
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Execute each test file
testFiles.forEach((testFile) => {
  console.log(`\n📋 Running: ${testFile}`);
  console.log('─'.repeat(50));
  
  try {
    // Run the test with Playwright
    execSync(`npx playwright test ${path.join(testsDir, testFile)} --reporter=list`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../..')
    });
    
    results.passed++;
    console.log(`✅ ${testFile} - PASSED`);
  } catch (error) {
    results.failed++;
    console.log(`❌ ${testFile} - FAILED`);
  }
  
  results.total++;
});

// Print summary
console.log('\n\n📊 Test Results Summary');
console.log('======================');
console.log(`Total Tests: ${results.total}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⏭️  Skipped: ${results.skipped}`);
console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);