/**
 * Simple script to start the application
 * This helps diagnose issues with file paths
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if src directory exists
const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
  console.error('\x1b[31mError: "src" directory not found. Please create it first.\x1b[0m');
  console.log('Directory structure should be:');
  console.log('team-polls/');
  console.log('├── src/');
  console.log('│   ├── config/');
  console.log('│   ├── middleware/');
  console.log('│   ├── models/');
  console.log('│   ├── routes/');
  console.log('│   ├── services/');
  console.log('│   ├── utils/');
  console.log('│   ├── validators/');
  console.log('│   ├── app.ts');
  console.log('│   └── server.ts');
  console.log('├── migrations/');
  console.log('├── scripts/');
  console.log('└── ...');
  process.exit(1);
}

// Check if server.ts exists
const serverFile = path.join(srcDir, 'server.ts');
if (!fs.existsSync(serverFile)) {
  console.error('\x1b[31mError: "src/server.ts" file not found.\x1b[0m');
  console.log('Make sure all backend files are inside the src directory.');
  process.exit(1);
}

// Start the development server
console.log('\x1b[32mStarting development server...\x1b[0m');
const server = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', serverFile], {
  stdio: 'inherit',
  shell: true,
});

server.on('error', (err) => {
  console.error('\x1b[31mFailed to start server:\x1b[0m', err);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\x1b[31mServer process exited with code ${code}\x1b[0m`);
  }
});