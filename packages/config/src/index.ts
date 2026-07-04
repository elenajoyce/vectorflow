import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const configSchema = z.object({
  STELLAR_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  STELLAR_NETWORK_PASSPHRASE: z.string().default('Test SGD Network ; September 2015'),
  STELLAR_RPC_URL: z.string().url().default('https://soroban-testnet.stellar.org'),
  DEPLOYER_SECRET_KEY: z.string().optional(),
  STREAM_ESCROW_CONTRACT_ID: z.string().optional(),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('file:./vector-flow.db'),
  RELAYER_SECRET_KEY: z.string().optional(),
  RELAY_POLL_INTERVAL_MS: z.coerce.number().default(5000),
});

export const Config = configSchema.parse(process.env);
export type ConfigType = z.infer<typeof configSchema>;
