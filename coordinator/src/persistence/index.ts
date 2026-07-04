import Database from 'better-sqlite3';
import { Config } from '@vector-flow/config';
import * as path from 'path';

// Clean database path from URI prefix if any
const dbPath = Config.DATABASE_URL.replace('file:', '');
const resolvedPath = path.resolve(process.cwd(), dbPath);

const db = new Database(resolvedPath);

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    token TEXT NOT NULL,
    total_amount TEXT NOT NULL,
    withdrawn_amount TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    stop_time INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

export interface DBStream {
  id: number;
  sender: string;
  recipient: string;
  token: string;
  total_amount: string;
  withdrawn_amount: string;
  start_time: number;
  stop_time: number;
  active: number;
}

export const Persistence = {
  saveStream(stream: DBStream) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO streams (id, sender, recipient, token, total_amount, withdrawn_amount, start_time, stop_time, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      stream.id,
      stream.sender,
      stream.recipient,
      stream.token,
      stream.total_amount,
      stream.withdrawn_amount,
      stream.start_time,
      stream.stop_time,
      stream.active
    );
  },

  getStream(id: number): DBStream | undefined {
    const stmt = db.prepare('SELECT * FROM streams WHERE id = ?');
    return stmt.get(id) as DBStream | undefined;
  },

  listStreams(): DBStream[] {
    const stmt = db.prepare('SELECT * FROM streams ORDER BY id DESC');
    return stmt.all() as DBStream[];
  },
};
