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
    if (lower.includes('ssh') && (lower.includes('run_command') || lower.includes('system_message'))) {
      const obj = JSON.parse(line);
      console.log(`[Line ${index}] Type: ${obj.type}, Source: ${obj.source}`);
      console.log(JSON.stringify(obj.content || obj.tool_calls || {}).substring(0, 500));
      console.log('-'.repeat(40));
    }
  }
}

run();
