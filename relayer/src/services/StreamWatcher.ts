import { rpc, scValToNative } from 'stellar-sdk';
import { Config } from '@vector-flow/config';
import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = Config.DATABASE_URL.replace('file:', '');
const resolvedPath = path.resolve(process.cwd(), dbPath);
const db = new Database(resolvedPath);

export class StreamWatcher {
  private rpcServer: rpc.Server;
  private lastLedger: number = 0;

  constructor() {
    this.rpcServer = new rpc.Server(Config.STELLAR_RPC_URL);
  }

  public async startPolling() {
    console.log('👀 VectorFlow Event Watcher started polling Soroban ledger...');
    
    // Get latest ledger to start
    try {
      const info = await this.rpcServer.getLatestLedger();
      this.lastLedger = info.sequence;
    } catch {
      this.lastLedger = 0;
    }

    setInterval(async () => {
      try {
        await this.pollEvents();
      } catch (err: any) {
        console.error('Error polling Soroban events:', err.message);
      }
    }, Config.RELAY_POLL_INTERVAL_MS);
  }

  private async pollEvents() {
    if (!Config.STREAM_ESCROW_CONTRACT_ID) {
      return; // Not deployed yet
    }

    const latest = await this.rpcServer.getLatestLedger();
    if (latest.sequence <= this.lastLedger) {
      return;
    }

    // Query events from last ledger to latest
    const eventRes = await this.rpcServer.getEvents({
      startLedger: this.lastLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [Config.STREAM_ESCROW_CONTRACT_ID],
        },
      ],
      limit: 50,
    });

    for (const event of eventRes.events) {
      this.processEvent(event);
    }

    this.lastLedger = latest.sequence;
  }

  private processEvent(event: rpc.Api.EventResponse) {
    try {
      const topic = event.topic[0];
      const topicSym = scValToNative(topic as any);

      if (topicSym === 'stream_created') {
        const streamId = Number(scValToNative(event.topic[1] as any));
        const value = scValToNative(event.value as any);
        
        // Save stream to SQLite
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO streams (id, sender, recipient, token, total_amount, withdrawn_amount, start_time, stop_time, active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);
        stmt.run(
          streamId,
          value[0], // sender
          value[1], // recipient
          event.contractId, // token
          value[2].toString(), // total_amount
          '0', // withdrawn_amount
          Math.floor(Date.now() / 1000), // start_time (fallback to mock ledger time)
          Math.floor(Date.now() / 1000) + 3600 // stop_time (fallback)
        );
        console.log(`✨ Cached StreamCreated event: ID ${streamId}`);
      } else if (topicSym === 'stream_withdrawn') {
        const streamId = Number(scValToNative(event.topic[1] as any));
        const value = scValToNative(event.value as any);
        const amount = BigInt(value[1]);

        // Update withdrawn count
        const stmt = db.prepare('UPDATE streams SET withdrawn_amount = withdrawn_amount + ? WHERE id = ?');
        stmt.run(amount.toString(), streamId);
        console.log(`💸 Processed StreamWithdrawn event: ID ${streamId}, amount ${amount}`);
      } else if (topicSym === 'stream_cancelled') {
        const streamId = Number(scValToNative(event.topic[1] as any));
        const stmt = db.prepare('UPDATE streams SET active = 0 WHERE id = ?');
        stmt.run(streamId);
        console.log(`❌ Processed StreamCancelled event: ID ${streamId}`);
      }
    } catch (err: any) {
      console.error('Failed to parse event:', err.message);
    }
  }
}
