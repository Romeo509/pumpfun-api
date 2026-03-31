import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConnection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { TransactionError, ValidationError } from '../lib/errors.js';
import { requestBuyTrade } from '../services/pump-portal.js';
import { DEFAULTS } from '../config/index.js';

/**
 * Performs sequential token purchases for an array of buy requests
 * @param {Array} buyRequests - Array of buy request objects
 * @param {string} buyRequests[].mintAddress - Token mint address to buy
 * @param {string} buyRequests[].privateKey - Private key in base58 format
 * @param {number} buyRequests[].amount - Amount in SOL to spend
 * @param {number} [buyRequests[].slippage] - Slippage percentage (default: 10)
 * @param {number} [buyRequests[].priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Array} Array of results for each transaction
 */
export async function sequentialBuyTokens(buyRequests) {
  // Validate input
  if (!Array.isArray(buyRequests) || buyRequests.length === 0) {
    throw new ValidationError('Buy requests must be a non-empty array');
  }

  const connection = getConnection();
  const results = [];

  logger.info('Starting sequential buy', { count: buyRequests.length });

  for (let i = 0; i < buyRequests.length; i++) {
    const request = buyRequests[i];

    // Validate required parameters for each request
    if (!request.mintAddress || !request.privateKey || request.amount === undefined || request.amount === null) {
      results.push({
        index: i,
        success: false,
        error: 'Mint address, private key, and amount are required for each request',
        request: { mintAddress: request.mintAddress, amount: request.amount }
      });
      continue;
    }

    try {
      const signer = Keypair.fromSecretKey(bs58.decode(request.privateKey));
      const slippage = request.slippage || DEFAULTS.SLIPPAGE;

      logger.info(`Processing buy ${i + 1}/${buyRequests.length}`, {
        mint: request.mintAddress,
        buyer: signer.publicKey.toBase58()
      });

      // Request unsigned transaction
      const txBytes = await requestBuyTrade({
        buyerPublicKey: signer.publicKey.toBase58(),
        mint: request.mintAddress,
        amount: request.amount,
        slippage,
        priorityFee: request.priorityFee || DEFAULTS.PRIORITY_FEE
      });

      // Deserialize and sign
      const transaction = VersionedTransaction.deserialize(txBytes);
      transaction.sign([signer]);

      // Send transaction
      const signature = await connection.sendTransaction(transaction, {
        skipPreflight: false
      });

      logger.info(`Buy ${i + 1}/${buyRequests.length} sent`, { signature });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain');
      }

      logger.info(`Buy ${i + 1}/${buyRequests.length} successful`, { signature });

      results.push({
        index: i,
        success: true,
        signature,
        transactionUrl: `https://solscan.io/tx/${signature}`,
        mintAddress: request.mintAddress,
        amountSpent: request.amount,
        slippage
      });
    } catch (error) {
      logger.error(`Buy ${i + 1}/${buyRequests.length} failed`, error, {
        mint: request.mintAddress
      });

      results.push({
        index: i,
        success: false,
        error: error.message,
        mintAddress: request.mintAddress,
        amount: request.amount
      });
    }
  }

  logger.info('Sequential buy completed', {
    total: buyRequests.length,
    successful: results.filter(r => r.success).length
  });

  return results;
}
