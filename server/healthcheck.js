const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000 // Increased timeout
};

console.log(`Health check: Checking ${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`Health check response: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log('Health check failed - bad status code');
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.log('Health check failed - error:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Health check failed - timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end();
