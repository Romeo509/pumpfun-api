import { Router } from 'express';
import multer from 'multer';
import { createToken } from '../operations/create-token.js';
import { buyToken } from '../operations/buy-token.js';
import { sellToken } from '../operations/sell-token.js';
import { sequentialBuyTokens } from '../operations/jito-bundle.js';
import { prepareImageBuffer, writeTempImage, cleanupTempFile } from '../services/ipfs.js';
import { logger } from '../lib/logger.js';

const router = Router();
const upload = multer();

/**
 * @swagger
 * /api/create-token:
 *   post:
 *     summary: Create a new token on Pump.fun
 *     description: Creates a new token on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - image
 *               - privateKey
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Token name
 *               symbol:
 *                 type: string
 *                 description: Token symbol
 *               description:
 *                 type: string
 *                 description: Token description
 *               twitter:
 *                 type: string
 *                 description: Twitter URL
 *               telegram:
 *                 type: string
 *                 description: Telegram URL
 *               website:
 *                 type: string
 *                 description: Website URL
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *               amount:
 *                 type: number
 *                 description: Dev buy amount in SOL
 *               priorityFee:
 *                 type: number
 *                 description: Priority fee in SOL
 *     responses:
 *       200:
 *         description: Token created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/create-token', async (req, res, next) => {
  try {
    const { name, symbol, description, twitter, telegram, website, image, privateKey, amount, priorityFee } = req.body;

    if (!name || !symbol || !image || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, symbol, image, privateKey, and amount are required'
        }
      });
    }

    const result = await createToken({ name, symbol, description, twitter, telegram, website, image, privateKey, amount, priorityFee });

    res.json({
      success: true,
      message: 'Token created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error creating token', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/create-token-multipart:
 *   post:
 *     summary: Create a new token with multipart form data
 *     description: Create a new token with multipart form data for image upload
 *     tags: [Tokens]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - symbol
 *               - image
 *               - privateKey
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               description:
 *                 type: string
 *               twitter:
 *                 type: string
 *               telegram:
 *                 type: string
 *               website:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               privateKey:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Token created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/create-token-multipart', upload.single('image'), async (req, res, next) => {
  try {
    const { name, symbol, description, twitter, telegram, website, privateKey, amount } = req.body;

    if (!name || !symbol || !req.file || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, symbol, image file, privateKey, and amount are required'
        }
      });
    }

    const imageBase64 = `data:image/${req.file.mimetype.split('/')[1]};base64,${req.file.buffer.toString('base64')}`;

    const result = await createToken({
      name,
      symbol,
      description,
      twitter,
      telegram,
      website,
      image: imageBase64,
      privateKey,
      amount
    });

    res.json({
      success: true,
      message: 'Token created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error creating token (multipart)', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/buy-token:
 *   post:
 *     summary: Buy tokens on Pump.fun
 *     description: Buys tokens on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mintAddress
 *               - privateKey
 *               - amount
 *             properties:
 *               mintAddress:
 *                 type: string
 *                 description: Token mint address to buy
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *               amount:
 *                 type: number
 *                 description: Amount in SOL to spend
 *               slippage:
 *                 type: number
 *                 description: "Slippage percentage (default: 10)"
 *               priorityFee:
 *                 type: number
 *                 description: "Priority fee in SOL (default: 0.005)"
 *     responses:
 *       200:
 *         description: Token purchase successful
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/buy-token', async (req, res, next) => {
  try {
    const { mintAddress, privateKey, amount, slippage, priorityFee } = req.body;

    if (!mintAddress || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: mintAddress, privateKey, and amount are required'
        }
      });
    }

    const result = await buyToken({ mintAddress, privateKey, amount, slippage, priorityFee });

    res.json({
      success: true,
      message: 'Token purchase successful',
      data: result
    });
  } catch (error) {
    logger.error('Error buying token', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/sell-token:
 *   post:
 *     summary: Sell tokens on Pump.fun
 *     description: Sells tokens on the Solana blockchain via Pump.fun
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mintAddress
 *               - privateKey
 *               - amount
 *             properties:
 *               mintAddress:
 *                 type: string
 *                 description: Token mint address to sell
 *               privateKey:
 *                 type: string
 *                 description: Private key in base58 format
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to sell
 *               slippage:
 *                 type: number
 *                 description: "Slippage percentage (default: 10)"
 *               priorityFee:
 *                 type: number
 *                 description: "Priority fee in SOL (default: 0.005)"
 *     responses:
 *       200:
 *         description: Token sell successful
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/sell-token', async (req, res, next) => {
  try {
    const { mintAddress, privateKey, amount, slippage, priorityFee } = req.body;

    if (!mintAddress || !privateKey || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: mintAddress, privateKey, and amount are required'
        }
      });
    }

    const result = await sellToken({ mintAddress, privateKey, amount, slippage, priorityFee });

    res.json({
      success: true,
      message: 'Token sell successful',
      data: result
    });
  } catch (error) {
    logger.error('Error selling token', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/sequential-buy-tokens:
 *   post:
 *     summary: Perform sequential token purchases
 *     description: Performs sequential token purchases for an array of buy requests
 *     tags: [Tokens]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyRequests
 *             properties:
 *               buyRequests:
 *                 type: array
 *                 description: Array of buy request objects
 *                 items:
 *                   type: object
 *                   required:
 *                     - mintAddress
 *                     - privateKey
 *                     - amount
 *                   properties:
 *                     mintAddress:
 *                       type: string
 *                     privateKey:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     slippage:
 *                       type: number
 *                     priorityFee:
 *                       type: number
 *     responses:
 *       200:
 *         description: Sequential token purchases completed
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/sequential-buy-tokens', async (req, res, next) => {
  try {
    const { buyRequests } = req.body;

    if (!buyRequests || !Array.isArray(buyRequests) || buyRequests.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: buyRequests must be a non-empty array'
        }
      });
    }

    const results = await sequentialBuyTokens(buyRequests);

    res.json({
      success: true,
      message: 'Sequential token purchases completed',
      data: results
    });
  } catch (error) {
    logger.error('Error in sequential token purchases', error);
    next(error);
  }
});

export default router;
