/**
 * Simple test client to verify API functionality
 */

const http = require('http');

// Test URLs
const urls = [
  { method: 'GET', url: 'http://localhost:3000/test' },
  { method: 'GET', url: 'http://localhost:3000/health' },
  { method: 'POST', url: 'http://localhost:3000/auth/anon' }
];

// Make a request
const makeRequest = (method, url) => {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

// Test all URLs
const testAll = async () => {
  console.log('Testing API endpoints...');
  
  for (const { method, url } of urls) {
    try {
      console.log(`Testing ${method} ${url}...`);
      const response = await makeRequest(method, url);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      console.log('');
    } catch (error) {
      console.error(`  Error testing ${method} ${url}:`, error.message);
    }
  }
  
  console.log('Tests completed.');
};

// Run the tests
testAll();