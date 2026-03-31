import { Router } from 'express';
import { getSOLPrice } from '../price/binance.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * @swagger
 * /api/sol-price:
 *   get:
 *     summary: Get current SOL/USDT price from Binance
 *     description: Fetches the current price of SOL in USDT from Binance API
 *     tags: [Price]
 *     responses:
 *       200:
 *         description: Current SOL price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 symbol:
 *                   type: string
 *                   example: "SOLUSDT"
 *                 price:
 *                   type: number
 *                   example: 98.45
 *                 timestamp:
 *                   type: number
 *                   example: 1678886400000
 *       500:
 *         description: Error retrieving price data
 */
router.get('/sol-price', async (req, res, next) => {
  try {
    const result = await getSOLPrice();
    res.json(result);
  } catch (error) {
    logger.error('Error in SOL price endpoint', error);
    next(error);
  }
});

export default router;
