import https from 'https';

const backendUrl = new URL(process.env.BACKEND_API_URL || 'https://technician-app.onrender.com');
backendUrl.pathname = '/health';

const req = https.request(backendUrl, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
  res.on('end', () => process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1));
});

req.on('error', (e) => {
  console.log(`Failed to reach backend: ${e.message}`);
  process.exit(1);
});

req.end();
