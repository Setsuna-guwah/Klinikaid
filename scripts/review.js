const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Helper to load .env.local manually
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
    // Strip quotes if any
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
  console.error('Error: ANTHROPIC_API_KEY not found in .env.local or process.env');
  console.error('Please add ANTHROPIC_API_KEY=your_key_here to .env.local');
  process.exit(1);
}

// Find latest phase folder if not specified
let phaseDir = process.argv[2];
if (!phaseDir) {
  const docsPath = path.join(__dirname, '..', 'docs');
  if (fs.existsSync(docsPath)) {
    const folders = fs.readdirSync(docsPath)
      .filter(f => f.startsWith('phase-') && fs.statSync(path.join(docsPath, f)).isDirectory())
      .sort(); // Sort alphabetically so phase-06 comes after phase-05
    if (folders.length > 0) {
      phaseDir = path.join('docs', folders[folders.length - 1]);
    }
  }
}

if (!phaseDir) {
  console.error('Error: Could not determine phase directory. Please specify one:');
  console.error('node scripts/review.js docs/phase-06-specialist');
  process.exit(1);
}

const absolutePhaseDir = path.isAbsolute(phaseDir) ? phaseDir : path.join(__dirname, '..', phaseDir);
if (!fs.existsSync(absolutePhaseDir)) {
  console.error(`Error: Phase directory does not exist: ${absolutePhaseDir}`);
  process.exit(1);
}

console.log(`Starting Claude review for phase directory: ${phaseDir}`);

// 1. Read Source of Truth files
const truthPath = path.join(__dirname, '..', 'docs', 'aSourceOfTruth');
let sourceOfTruthContent = '';
if (fs.existsSync(truthPath)) {
  const files = fs.readdirSync(truthPath).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    const filePath = path.join(truthPath, file);
    sourceOfTruthContent += `\n\n--- FILE: aSourceOfTruth/${file} ---\n`;
    sourceOfTruthContent += fs.readFileSync(filePath, 'utf8');
  });
}

// 2. Read Phase Documents
let phaseDocsContent = '';
const phaseFiles = fs.readdirSync(absolutePhaseDir).filter(f => f.endsWith('.md') && !f.includes('claude-review'));
phaseFiles.forEach(file => {
  const filePath = path.join(absolutePhaseDir, file);
  phaseDocsContent += `\n\n--- FILE: ${path.basename(phaseDir)}/${file} ---\n`;
  phaseDocsContent += fs.readFileSync(filePath, 'utf8');
});

// 3. Get Git Diff
let gitDiff = '';
try {
  // Diff unstaged + staged changes, excluding documentation/scratch paths
  const diffCommand = 'git diff HEAD -- . ":!docs" ":!scratch" ":!skills" ":!package-lock.json"';
  gitDiff = execSync(diffCommand, { encoding: 'utf8' }).trim();
  if (!gitDiff) {
    console.log('No uncommitted changes detected. Diffing against HEAD~1...');
    const fallbackDiff = 'git diff HEAD~1 -- . ":!docs" ":!scratch" ":!skills" ":!package-lock.json"';
    gitDiff = execSync(fallbackDiff, { encoding: 'utf8' }).trim();
  }
} catch (err) {
  console.warn('Warning: Failed to run git diff. Will proceed without code diff.');
}

// Prepare payload
const systemPrompt = `You are the Claude Supervisor and Phase Reviewer for KlinikAid.
Your job is to review the implementation of the current phase against:
1. The project's Source of Truth (guidelines, rules, and master context).
2. The current phase's implementation plan, task list, and walkthrough.
3. The git diff showing the actual code changes.

Analyze the code changes thoroughly. Look for:
- Database schema or query violations (e.g. invalid join structures, missing type checking, array checks on Supabase single relation joins).
- Next.js 14 App Router standards.
- Styling guidelines (clean CSS, dark mode support, visual excellence, premium look).
- Correctness, edge cases, error handling, loading states.
- Discrepancies between the implementation plan/walkthrough and the actual code.

Structure your review with:
- **SUMMARY**: 1-2 sentence overview of the phase review status.
- **GREEN FLAGS**: Bullet points of things done exceptionally well or correctly according to spec.
- **RED FLAGS (MUST FIX)**: Critical issues, bugs, type mismatches, or rule violations. Detail the file and exact issue.
- **SUGGESTIONS**: Quality-of-life, minor improvements, or optimization advice.

Be direct, objective, and extremely precise. Focus on technical accuracy.`;

const userContent = `Here is the context for the current phase review:

### SOURCE OF TRUTH CONTEXT
${sourceOfTruthContent}

### PHASE DOCUMENTS
${phaseDocsContent}

### CODE DIFF
\`\`\`diff
${gitDiff || '(No git diff available)'}
\`\`\`

Please perform the review now.`;

const models = [
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-6',
  'claude-opus-4-7'
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
    console.error('Error: All candidate models failed or returned 400/404.');
    process.exit(1);
  }

  const model = models[modelIndex];
  console.log(`Sending request to Anthropic Claude API using model: ${model}...`);

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
        console.warn(`Warning: Model ${model} not available (${res.statusCode}). Details:`);
        console.warn(responseData);
        runWithModel(modelIndex + 1);
        return;
      }

      if (res.statusCode !== 200) {
        console.error(`Error: Claude API returned status code ${res.statusCode}`);
        console.error(responseData);
        process.exit(1);
      }

      try {
        const parsed = JSON.parse(responseData);
        const text = parsed.content[0].text;
        
        const outputPath = path.join(absolutePhaseDir, 'claude-review.md');
        fs.writeFileSync(outputPath, text, 'utf8');
        
        console.log(`\nSuccess! Review saved to: ${outputPath}`);
      } catch (e) {
        console.error('Error parsing response from API:', e);
        console.log('Raw response:', responseData);
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
