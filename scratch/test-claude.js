const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.slice(0, firstEquals).trim();
    let val = trimmed.slice(firstEquals + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  });
  return env;
}

const env = loadEnv();
const apiKey = env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('No key found.');
  process.exit(1);
}

console.log('Parsed API Key Length:', apiKey.length);
console.log('Parsed API Key Char Codes:', [...apiKey].map(c => c.charCodeAt(0)).join(', '));
console.log('Starts with sk-ant-:', apiKey.startsWith('sk-ant-'));
console.log('Ends with QAA:', apiKey.endsWith('QAA'));

console.log('Querying available models from /v1/models...');

const req = https.request({
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/models',
  method: 'GET',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', err => {
  console.error('Request error:', err);
});

req.end();
