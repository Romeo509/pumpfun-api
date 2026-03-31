import { Connection } from '@solana/web3.js';
import { RPC_ENDPOINT } from '../config/index.js';

let connectionInstance = null;

export function getConnection() {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_ENDPOINT, 'confirmed');
  }
  return connectionInstance;
}

export function resetConnection() {
  connectionInstance = null;
}
