/**
 * Initialization script to create required directories
 */

const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', 'Initializing project structure...');

// Required directories
const directories = [
  'src',
  'src/config',
  'src/middleware',
  'src/models',
  'src/routes',
  'src/services',
  'src/utils',
  'src/validators',
  'migrations',
  'frontend/src/components',
  'frontend/public',
  'tests/unit',
  'tests/integration',
  'docker'
];

// Create directories if they don't exist
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Create empty placeholder files for critical components if they don't exist
const placeholderFiles = [
  { path: 'src/app.ts', content: `// Placeholder app.ts file\n// Replace with your actual code\nimport express from 'express';\nconst app = express();\nexport default app;\n` },
  { path: 'src/server.ts', content: `// Placeholder server.ts file\n// Replace with your actual code\nimport app from './app';\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));\n` },
];

placeholderFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);
  if (!fs.existsSync(filePath)) {
    console.log(`Creating placeholder file: ${file.path}`);
    fs.writeFileSync(filePath, file.content);
  }
});

console.log('\x1b[32m%s\x1b[0m', 'Project structure initialized! ✅');
console.log('\x1b[33m%s\x1b[0m', 'Please replace the placeholder files with your actual code.');
console.log('\x1b[36m%s\x1b[0m', 'Next steps:');
console.log('1. npm install');
console.log('2. docker compose up -d postgres redis');
console.log('3. npm run dev:all');