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
    const lower = line.toLowerCase();
    if (lower.includes('cpanel') || lower.includes('rsync') || lower.includes('ftp') || lower.includes('upload') || lower.includes('git push') || lower.includes('pm2') || lower.includes('restart') || lower.includes('terminal')) {
      // Print first 500 chars of line
      if (lower.includes('run_command') || lower.includes('user_input')) {
        console.log(`[Line ${index}] ${line.substring(0, 300)}...`);
      }
    }
  }
}

run();
