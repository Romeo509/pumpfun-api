import fetch from 'node-fetch';
import { BINANCE_API } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { PriceFetchError } from '../lib/errors.js';

/**
 * Fetches the current price of SOL/USDT from Binance API
 * @returns {Object} Object containing success status and price data
 */
export async function getSOLPrice() {
  try {
    logger.debug('Fetching SOL price from Binance');

    const response = await fetch(`${BINANCE_API}/ticker/price?symbol=SOLUSDT`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.price) {
      throw new Error('Invalid response format from Binance API');
    }

    logger.debug('SOL price fetched', { price: data.price });

    return {
      success: true,
      symbol: data.symbol,
      price: parseFloat(data.price),
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error('Failed to fetch SOL price', error);
    throw new PriceFetchError('Failed to fetch SOL price', error);
  }
}
