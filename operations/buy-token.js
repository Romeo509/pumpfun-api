import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConnection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { TransactionError, ValidationError } from '../lib/errors.js';
import { requestBuyTrade } from '../services/pump-portal.js';
import { DEFAULTS } from '../config/index.js';

/**
 * Buys tokens on the Solana blockchain via Pump.fun
 * @param {Object} params - Buy parameters
 * @param {string} params.mintAddress - Token mint address to buy
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number} params.amount - Amount in SOL to spend
 * @param {number} [params.slippage] - Slippage percentage (default: 10)
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and details
 */
export async function buyToken({
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

  logger.info('Buying token', {
    mint: mintAddress,
    buyer: signer.publicKey.toBase58(),
    amount
  });

  try {
    // Request unsigned transaction
    const txBytes = await requestBuyTrade({
      buyerPublicKey: signer.publicKey.toBase58(),
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

    logger.info('Buy transaction sent', { signature });

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error('Transaction failed on-chain');
    }

    logger.info('Buy successful', { signature, mint: mintAddress });

    return {
      success: true,
      signature,
      transactionUrl: `https://solscan.io/tx/${signature}`,
      mintAddress,
      amountSpent: amount
    };
  } catch (error) {
    logger.error('Buy failed', error, { mint: mintAddress });
    throw new TransactionError(error.message, error.signature);
  }
}
