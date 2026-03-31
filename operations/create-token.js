import { VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConnection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { TransactionError, ValidationError } from '../lib/errors.js';
import { requestCreateTrade } from '../services/pump-portal.js';
import { uploadTokenMetadata, prepareImageBuffer, writeTempImage, cleanupTempFile } from '../services/ipfs.js';
import { DEFAULTS } from '../config/index.js';

/**
 * Creates a new token on the Solana blockchain via Pump.fun
 * @param {Object} params - Token creation parameters
 * @param {string} params.name - Token name
 * @param {string} params.symbol - Token symbol
 * @param {string} [params.description] - Token description
 * @param {string} [params.twitter] - Twitter URL
 * @param {string} [params.telegram] - Telegram URL
 * @param {string} [params.website] - Website URL
 * @param {string} params.image - Base64 encoded image string or path to image file
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number} params.amount - Dev buy amount in SOL
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and token details
 */
export async function createToken({
  name,
  symbol,
  description = 'This is an example token created via API',
  twitter,
  telegram,
  website,
  image,
  privateKey,
  amount,
  priorityFee = DEFAULTS.PRIORITY_FEE
}) {
  // Validate required parameters
  if (!name || !symbol || !privateKey || amount === undefined || amount === null) {
    throw new ValidationError('Token name, symbol, private key, and amount are required');
  }

  const connection = getConnection();
  const signerKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const mintKeypair = Keypair.generate();

  logger.info('Creating token', {
    creator: signerKeypair.publicKey.toBase58(),
    mint: mintKeypair.publicKey.toBase58(),
    name,
    symbol
  });

  const tempImagePath = './temp-token-image.jpeg';

  try {
    // Prepare and save image
    const imageBuffer = await prepareImageBuffer(image);
    await writeTempImage(imageBuffer, tempImagePath);

    // Upload metadata to IPFS
    const metadata = await uploadTokenMetadata({
      imagePath: tempImagePath,
      name,
      symbol,
      description,
      twitter,
      telegram,
      website
    });

    // Request unsigned transaction from PumpPortal
    const txBytes = await requestCreateTrade({
      creatorPublicKey: signerKeypair.publicKey.toBase58(),
      mintPublicKey: mintKeypair.publicKey.toBase58(),
      tokenMetadata: {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri
      },
      amount,
      slippage: DEFAULTS.SLIPPAGE,
      priorityFee
    });

    // Deserialize and sign transaction
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair, signerKeypair]);

    // Send transaction
    const signature = await connection.sendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 3
    });

    logger.info('Token created successfully', {
      signature,
      mint: mintKeypair.publicKey.toBase58()
    });

    return {
      signature,
      mintAddress: mintKeypair.publicKey.toBase58(),
      creatorAddress: signerKeypair.publicKey.toBase58(),
      transactionUrl: `https://solscan.io/tx/${signature}`,
      metadataUri: metadata.uri
    };
  } catch (error) {
    logger.error('Token creation failed', error);
    throw new TransactionError(error.message);
  } finally {
    await cleanupTempFile(tempImagePath);
  }
}
