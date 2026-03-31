import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConnection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { TransactionError, ValidationError } from '../lib/errors.js';
import { requestSellTrade } from '../services/pump-portal.js';
import { DEFAULTS } from '../config/index.js';

/**
 * Sells tokens on the Solana blockchain via Pump.fun
 * @param {Object} params - Sell parameters
 * @param {string} params.mintAddress - Token mint address to sell
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number} params.amount - Amount of tokens to sell
 * @param {number} [params.slippage] - Slippage percentage (default: 10)
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and details
 */
export async function sellToken({
  mintAddress,
  privateKey,
  amount,
  slippage = DEFAULTS.SLIPPAGE,
  priorityFee = DEFAULTS.PRIORITY_FEE
}) {
  // Validate required parameters
  if (!mintAddress || !privateKey || amount === undefined || amount === null) {
    throw new ValidationError('Mint address, private key, and amount are required');
  }

  const connection = getConnection();
  const signer = Keypair.fromSecretKey(bs58.decode(privateKey));

  logger.info('Selling token', {
    mint: mintAddress,
    seller: signer.publicKey.toBase58(),
    amount
  });

  try {
    // Request unsigned transaction
    const txBytes = await requestSellTrade({
      sellerPublicKey: signer.publicKey.toBase58(),
      mint: mintAddress,
      amount,
      slippage,
      priorityFee
    });

    // Deserialize and sign
    const transaction = VersionedTransaction.deserialize(txBytes);
    transaction.sign([signer]);

    // Send transaction
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false
    });

    logger.info('Sell transaction sent', { signature });

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error('Transaction failed on-chain');
    }

    logger.info('Sell successful', { signature, mint: mintAddress });

    return {
      success: true,
      signature,
      transactionUrl: `https://solscan.io/tx/${signature}`,
      mintAddress,
      amountSold: amount,
      slippage,
      priorityFee
    };
  } catch (error) {
    logger.error('Sell failed', error, { mint: mintAddress });
    throw new TransactionError(error.message, error.signature);
  }
}
