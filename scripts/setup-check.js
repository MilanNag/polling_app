/**
 * Script to check if the project structure is correct
 */

const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', 'Checking project structure...');

// Required directories
const requiredDirs = [
  'src',
  'src/config',
  'src/middleware',
  'src/models',
  'src/routes',
  'src/services',
  'src/utils',
  'src/validators',
  'migrations',
  'frontend',
  'frontend/src',
  'frontend/src/components'
];

// Required files
const requiredFiles = [
  'src/app.ts',
  'src/server.ts',
  'frontend/src/App.tsx',
  'frontend/src/main.tsx',
  'frontend/src/components/PollResults.tsx',
  'frontend/App.css',
  'docker-compose.yml',
  'package.json',
  'tsconfig.json'
];

let missingItems = false;

// Check directories
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    console.log('\x1b[31m%s\x1b[0m', `❌ Missing directory: ${dir}`);
    missingItems = true;
  } else {
    console.log('\x1b[32m%s\x1b[0m', `✅ Found directory: ${dir}`);
  }
}

// Check files
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    console.log('\x1b[31m%s\x1b[0m', `❌ Missing file: ${file}`);
    missingItems = true;
  } else {
    console.log('\x1b[32m%s\x1b[0m', `✅ Found file: ${file}`);
  }
}

// CSS Import Check
const indexCssPath = path.join(__dirname, '..', 'frontend/src/index.css');
if (fs.existsSync(indexCssPath)) {
  const content = fs.readFileSync(indexCssPath, 'utf8');
  if (!content.trim().startsWith('@import')) {
    console.log('\x1b[33m%s\x1b[0m', `⚠️ Warning: CSS import statement in frontend/src/index.css should be at the top of the file.`);
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ CSS import is correctly placed');
  }
}

// Overall status
if (missingItems) {
  console.log('\n\x1b[31m%s\x1b[0m', '❌ Project structure is incomplete. Please fix the missing items.');
  console.log('\n\x1b[33m%s\x1b[0m', 'If you are seeing "Cannot find module" errors, make sure to:');
  console.log('\x1b[33m%s\x1b[0m', '1. Create all missing directories');
  console.log('\x1b[33m%s\x1b[0m', '2. Move backend files into the src directory');
  console.log('\x1b[33m%s\x1b[0m', '3. Run "npm run dev" from the project root directory');
} else {
  console.log('\n\x1b[32m%s\x1b[0m', '✅ Project structure looks good!');
  
  // Additional checks for running services
  console.log('\n\x1b[36m%s\x1b[0m', 'Checking required services:');
  
  // Check if postgres is running (simple check - not foolproof)
  try {
    require('child_process').execSync('docker ps | grep postgres', { stdio: 'pipe' });
    console.log('\x1b[32m%s\x1b[0m', '✅ PostgreSQL appears to be running');
  } catch (e) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ PostgreSQL may not be running. Start it with: docker compose up -d postgres');
  }
  
  // Check if redis is running
  try {
    require('child_process').execSync('docker ps | grep redis', { stdio: 'pipe' });
    console.log('\x1b[32m%s\x1b[0m', '✅ Redis appears to be running');
  } catch (e) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Redis may not be running. Start it with: docker compose up -d redis');
  }
  
  console.log('\n\x1b[36m%s\x1b[0m', 'Ready to go! 🚀');
  console.log('\x1b[36m%s\x1b[0m', 'Run the application with: npm run dev:all');
}