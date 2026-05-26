const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFile = path.join('C:', 'Users', 'Dhanush', '.gemini', 'antigravity', 'brain', 'f5f7b371-90a5-4ffc-a407-c3743cce549d', '.system_generated', 'logs', 'transcript.jsonl');

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (line.toLowerCase().includes('deploy') || line.toLowerCase().includes('sync') || line.toLowerCase().includes('git push') || line.toLowerCase().includes('ssh')) {
      // Print truncated line to avoid flooding
      console.log(`[Line ${index}] ${line.substring(0, 300)}...`);
    }
  }
}

run();
