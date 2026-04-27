import http from 'http';

const options = {
  hostname: '10.246.194.196',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => {
  console.log(`Failed to reach backend: ${e.message}`);
});

req.end();
