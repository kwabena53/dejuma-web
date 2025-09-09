const { chromium } = require('@playwright/test');

async function openApp() {
  console.log('🚀 Starting development server...');
  
  // Start the Next.js development server
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Wait for server to be ready
  let serverReady = false;
  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    if (output.includes('Ready') || output.includes('localhost:3000')) {
      serverReady = true;
    }
  });

  server.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  // Wait for server to be ready
  console.log('⏳ Waiting for server to start...');
  while (!serverReady) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🌐 Opening Chrome browser...');
  
  // Launch Chrome browser
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use system Chrome if available
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  const context = await browser.newContext({
    viewport: null // Use full viewport
  });

  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to the app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ App opened successfully!');
    console.log('🔍 You can now interact with your HandyPro app in Chrome');
    console.log('📝 To stop: Press Ctrl+C in the terminal');
    
    // Keep the browser open
    process.on('SIGINT', async () => {
      console.log('\n🛑 Closing browser and stopping server...');
      await browser.close();
      server.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error opening the app:', error.message);
    await browser.close();
    server.kill();
  }
}

openApp().catch(console.error);