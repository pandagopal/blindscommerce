import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if the application is running
    await page.goto(baseURL!);
    console.log('✅ Application is running at', baseURL);
  } catch (error) {
    console.error('❌ Application is not running. Please start the dev server first.');
    console.error('Run: npm run dev');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

export default globalSetup;