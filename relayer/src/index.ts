import { StreamWatcher } from './services/StreamWatcher.js';

async function main() {
  const watcher = new StreamWatcher();
  await watcher.startPolling();
}

main().catch((err) => {
  console.error('Fatal error starting Stream Watcher:', err);
  process.exit(1);
});
