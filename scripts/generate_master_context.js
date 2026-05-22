const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
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
const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY not found in env');
  process.exit(1);
}

// 1. Read Source of Truth files
const truthPath = path.join(__dirname, '..', 'docs', 'aSourceOfTruth');
const guidePath = path.join(truthPath, 'KlinikAid_Web_Implementation_Guide_v2.md');
const currentContextPath = path.join(truthPath, 'MASTER_CONTEXT latest.md');

if (!fs.existsSync(guidePath) || !fs.existsSync(currentContextPath)) {
  console.error('Error: Source of truth files not found in docs/aSourceOfTruth');
  process.exit(1);
}

const guideContent = fs.readFileSync(guidePath, 'utf8');
const contextContent = fs.readFileSync(currentContextPath, 'utf8');

const systemPrompt = `You are the Claude Supervisor and System Architect for KlinikAid.
Your task is to generate the updated MASTER_CONTEXT.md file for the next phase (Phase 8 - System Logs).

Instructions:
1. Set the "Current Phase" to "Phase 8 — System Logs".
2. Mark "Phase 7 — RAG Knowledge Base" as complete (✅ Complete) in the "Phases Completed" table.
3. Update the "Confirmed File Structure" if Phase 8 introduces new files (such as logs dashboard and API routes: app/admin/logs/page.tsx, api/admin/logs/system/route.ts, api/admin/logs/chatbot/route.ts, api/admin/logs/api-costs/route.ts, and component LogEventBadge.tsx).
4. Add any Phase 8 specific database decisions, constraints, or query patterns to the Database section (e.g. event logging event types, tokens count rates, estimate calculations).
5. Output ONLY the complete, raw markdown file contents for the new MASTER_CONTEXT.md, without any conversational wrapper, quotes, or markdown code-block tags. Just start with '# MASTER_CONTEXT.md'.`;

const userContent = `Here is the current guide and existing master context:

--- GUIDE ---
${guideContent}

--- EXISTING MASTER CONTEXT ---
${contextContent}

Please generate the updated MASTER_CONTEXT.md for Phase 8 now.`;

const models = [
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001'
];

const reqOptions = {
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  }
};

function runWithModel(modelIndex) {
  if (modelIndex >= models.length) {
    console.error('Error: All models failed.');
    process.exit(1);
  }

  const model = models[modelIndex];
  console.log(`Requesting updated MASTER_CONTEXT.md from Claude using model: ${model}...`);

  const payload = JSON.stringify({
    model: model,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userContent
      }
    ]
  });

  const req = https.request(reqOptions, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 404 || res.statusCode === 400) {
        console.warn(`Warning: Model ${model} failed (${res.statusCode}). trying next...`);
        runWithModel(modelIndex + 1);
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`Error: API returned status ${res.statusCode}`);
        console.error(responseData);
        process.exit(1);
      }

      try {
        const parsed = JSON.parse(responseData);
        let text = parsed.content[0].text.trim();
        
        // Strip markdown backticks if Claude added them despite instructions
        if (text.startsWith('```markdown')) {
          text = text.substring(11);
        } else if (text.startsWith('```')) {
          text = text.substring(3);
        }
        if (text.endsWith('```')) {
          text = text.substring(0, text.length - 3);
        }
        text = text.trim();

        const out1 = path.join(truthPath, 'MASTER_CONTEXT.md');
        const out2 = path.join(truthPath, 'MASTER_CONTEXT latest.md');

        fs.writeFileSync(out1, text, 'utf8');
        fs.writeFileSync(out2, text, 'utf8');

        console.log('\nSuccess! MASTER_CONTEXT.md updated for Phase 8.');
      } catch (e) {
        console.error('Error parsing response:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

runWithModel(0);
