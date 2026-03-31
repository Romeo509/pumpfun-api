// Solana RPC Configuration
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
// export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Server Configuration
export const PORT = process.env.PORT || 8000;

// API Endpoints
export const PUMP_PORTAL_API = 'https://pumpportal.fun/api/trade-local';
export const PUMP_FUN_IPFS_API = 'https://pump.fun/api/ipfs';
export const BINANCE_API = 'https://api.binance.com/api/v3';

// Default Transaction Settings
export const DEFAULTS = {
  SLIPPAGE: 10, // Used when user sends null, undefined, or omits slippage in the request
  PRIORITY_FEE: 0.005,
  POOL: 'auto'
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

// Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
