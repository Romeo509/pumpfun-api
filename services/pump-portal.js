import fetch from 'node-fetch';
import { PUMP_PORTAL_API, DEFAULTS, RETRY_CONFIG } from '../config/index.js';
import { PumpPortalError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function requestTrade(params, retries = RETRY_CONFIG.MAX_RETRIES) {
  const {
    publicKey,
    action,
    mint,
    denominatedInSol,
    amount,
    slippage = DEFAULTS.SLIPPAGE,
    priorityFee = DEFAULTS.PRIORITY_FEE,
    pool = DEFAULTS.POOL,
    tokenMetadata = null
  } = params;

  const body = {
    publicKey,
    action,
    mint,
    denominatedInSol,
    amount,
    slippage,
    priorityFee,
    pool
  };

  if (tokenMetadata) {
    body.tokenMetadata = tokenMetadata;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug(`PumpPortal request attempt ${attempt}/${retries}`, { action, mint: mint?.slice(0, 8) });
      
      const response = await fetch(PUMP_PORTAL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const txBuffer = await response.arrayBuffer();
      logger.debug('PumpPortal request successful', { action, size: txBuffer.byteLength });
      
      return new Uint8Array(txBuffer);
    } catch (error) {
      lastError = error;
      logger.warn(`PumpPortal request failed (attempt ${attempt}/${retries})`, { error: error.message });
      
      if (attempt < retries) {
        await sleep(RETRY_CONFIG.RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new PumpPortalError(`Failed after ${retries} attempts`, lastError);
}

export async function requestCreateTrade(params) {
  const {
    creatorPublicKey,
    mintPublicKey,
    tokenMetadata,
    amount,
    slippage = DEFAULTS.SLIPPAGE,
    priorityFee = DEFAULTS.PRIORITY_FEE
  } = params;

  return requestTrade({
    publicKey: creatorPublicKey,
    action: 'create',
    mint: mintPublicKey,
    denominatedInSol: true,
    amount,
    slippage,
    priorityFee,
    pool: 'pump',
    tokenMetadata
  });
}

export async function requestBuyTrade(params) {
  const {
    buyerPublicKey,
    mint,
    amount,
    slippage = DEFAULTS.SLIPPAGE,
    priorityFee = DEFAULTS.PRIORITY_FEE
  } = params;

  return requestTrade({
    publicKey: buyerPublicKey,
    action: 'buy',
    mint,
    denominatedInSol: true,
    amount,
    slippage,
    priorityFee,
    pool: 'auto'
  });
}

export async function requestSellTrade(params) {
  const {
    sellerPublicKey,
    mint,
    amount,
    slippage = DEFAULTS.SLIPPAGE,
    priorityFee = DEFAULTS.PRIORITY_FEE
  } = params;

  return requestTrade({
    publicKey: sellerPublicKey,
    action: 'sell',
    mint,
    denominatedInSol: false,
    amount,
    slippage,
    priorityFee,
    pool: 'auto'
  });
}
