const utils = require('@distube/ytdl-core/lib/utils');
const agentMod = require('@distube/ytdl-core/lib/agent');
const { createTask } = require('youtube-po-token-generator/lib/task');

async function main() {
  const videoId = process.argv[2] || 'dQw4w9WgXcQ';
  const options = { agent: agentMod.defaultAgent, requestOptions: {} };
  utils.applyDefaultHeaders(options);
  utils.applyDefaultAgent(options);

  const html = await utils.request(`https://www.youtube.com/watch?v=${videoId}`, options);
  const visitor = html.match(/"visitorData":"([^"]+)"/)?.[1];
  console.log('visitor', visitor?.slice(0, 30));

  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 30000));
  const task = await Promise.race([createTask(visitor), timeout]);
  const started = await Promise.race([task.start(), timeout]);
  console.log('poToken', started?.poToken?.slice(0, 50));
}

main().catch(console.error);
