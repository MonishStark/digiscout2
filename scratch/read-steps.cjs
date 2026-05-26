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
    const obj = JSON.parse(line);
    if (obj.step_index >= 5900 && obj.step_index <= 5980) {
      console.log(`[Step ${obj.step_index}] Type: ${obj.type}, Source: ${obj.source}`);
      console.log(JSON.stringify(obj.content || obj.tool_calls || {}).substring(0, 400));
      console.log('='.repeat(40));
    }
  }
}

run();
